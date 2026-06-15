import { NextRequest } from "next/server";
import { streamText } from "@/lib/anthropic";
import { tutorSystem } from "@/lib/prompts";
import type { ChatMessage } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 90;

interface Body {
  subject: string;
  goal: string;
  concept?: { name: string; summary: string; mastery: number };
  messages: ChatMessage[];
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const system = tutorSystem({
      subject: body.subject,
      goal: body.goal,
      conceptName: body.concept?.name,
      conceptSummary: body.concept?.summary,
      mastery: body.concept?.mastery,
    });

    const stream = streamText({
      system,
      messages: body.messages.map((m) => ({ role: m.role, content: m.content })),
      maxTokens: 1500,
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`[Atlas error: ${message}]`, { status: 500 });
  }
}
