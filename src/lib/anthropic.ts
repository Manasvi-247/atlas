import Anthropic from "@anthropic-ai/sdk";

/**
 * Atlas talks to Claude exclusively from the server (API routes). The key lives
 * in process.env and is never shipped to the browser.
 *
 * Two call shapes are used across the app:
 *   • structured()  — forced tool-use so Claude returns schema-valid JSON. This
 *                     is rock-solid across SDK versions and guarantees shape.
 *   • streamText()  — token streaming for lessons + the Socratic tutor, so the
 *                     UI feels alive (text appears as it's written).
 */

export const MODEL = process.env.ATLAS_MODEL || "claude-sonnet-4-6";

let _client: Anthropic | null = null;

export function getClient(): Anthropic {
  if (!_client) {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      throw new Error(
        "ANTHROPIC_API_KEY is not set. Copy .env.local.example to .env.local and add your key."
      );
    }
    _client = new Anthropic({ apiKey });
  }
  return _client;
}

export function hasKey(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

type JsonSchema = Record<string, unknown>;

/**
 * Ask Claude to fill in a JSON object matching `schema` by forcing a single
 * tool call. Returns the validated tool input, typed as T.
 */
export async function structured<T>(opts: {
  system: string;
  user: string;
  schema: JsonSchema;
  toolName?: string;
  toolDescription?: string;
  maxTokens?: number;
}): Promise<T> {
  const client = getClient();
  const toolName = opts.toolName ?? "respond";
  const res = await client.messages.create({
    model: MODEL,
    max_tokens: opts.maxTokens ?? 8000,
    system: opts.system,
    tools: [
      {
        name: toolName,
        description:
          opts.toolDescription ??
          "Return the structured response. You MUST call this tool exactly once.",
        input_schema: opts.schema as unknown as Anthropic.Tool.InputSchema,
      },
    ],
    tool_choice: { type: "tool", name: toolName },
    messages: [{ role: "user", content: opts.user }],
  });

  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("Model did not return a structured tool call.");
  }
  return block.input as T;
}

/**
 * Stream plain text from Claude as a web ReadableStream of UTF-8 chunks,
 * suitable for returning directly from a Next.js route handler.
 */
export function streamText(opts: {
  system: string;
  messages: { role: "user" | "assistant"; content: string }[];
  maxTokens?: number;
}): ReadableStream<Uint8Array> {
  const client = getClient();
  const encoder = new TextEncoder();

  return new ReadableStream({
    async start(controller) {
      try {
        const stream = client.messages.stream({
          model: MODEL,
          max_tokens: opts.maxTokens ?? 4000,
          system: opts.system,
          messages: opts.messages,
        });
        stream.on("text", (delta) => {
          controller.enqueue(encoder.encode(delta));
        });
        await stream.finalMessage();
        controller.close();
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Unknown error";
        controller.enqueue(encoder.encode(`\n\n[Atlas error: ${msg}]`));
        controller.close();
      }
    },
  });
}
