import type { LearningStyle } from "./types";

// JSON Schemas (used as forced-tool input_schema) ────────────────────────────

export const assessmentBatchSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    questions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          concept: { type: "string", description: "Concept name this probes" },
          difficulty: { type: "integer", description: "1 (easiest) to 5 (hardest)" },
          prompt: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answerIndex: { type: "integer" },
          explanation: { type: "string" },
        },
        required: ["id", "concept", "difficulty", "prompt", "choices", "answerIndex", "explanation"],
      },
    },
  },
  required: ["questions"],
} as const;

export const diagnosisSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    summary: { type: "string" },
    known: { type: "array", items: { type: "string" } },
    frontier: { type: "array", items: { type: "string" } },
    gaps: { type: "array", items: { type: "string" } },
    level: { type: "number", description: "Overall mastery estimate 0..1" },
    styleHint: {
      type: "object",
      additionalProperties: false,
      description: "Best-guess initial learning-style weights 0..1",
      properties: {
        analogy: { type: "number" },
        visual: { type: "number" },
        code: { type: "number" },
        story: { type: "number" },
        formal: { type: "number" },
      },
      required: ["analogy", "visual", "code", "story", "formal"],
    },
  },
  required: ["summary", "known", "frontier", "gaps", "level", "styleHint"],
} as const;

export const curriculumSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    concepts: {
      type: "array",
      description: "The full concept graph, prerequisite-ordered.",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string", description: "kebab-case stable id" },
          name: { type: "string" },
          summary: { type: "string", description: "what the learner will be able to DO" },
          prereqs: { type: "array", items: { type: "string" }, description: "concept ids" },
          difficulty: { type: "integer", description: "1..5" },
          knownAlready: { type: "boolean", description: "true if assessment shows mastery" },
        },
        required: ["id", "name", "summary", "prereqs", "difficulty", "knownAlready"],
      },
    },
    modules: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          title: { type: "string" },
          rationale: { type: "string", description: "why THIS learner gets this module" },
          conceptIds: { type: "array", items: { type: "string" } },
        },
        required: ["id", "title", "rationale", "conceptIds"],
      },
    },
  },
  required: ["concepts", "modules"],
} as const;

export const lessonMetaSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    quiz: {
      type: "array",
      description: "3-4 questions checking the lesson's concept(s).",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          id: { type: "string" },
          prompt: { type: "string" },
          choices: { type: "array", items: { type: "string" } },
          answerIndex: { type: "integer" },
          explanation: { type: "string" },
          concepts: { type: "array", items: { type: "string" } },
        },
        required: ["id", "prompt", "choices", "answerIndex", "explanation", "concepts"],
      },
    },
  },
  required: ["quiz"],
} as const;

// System prompts ──────────────────────────────────────────────────────────────

export const ASSESSMENT_SYSTEM = `You are the diagnostic engine of Atlas, an adaptive tutor. Your job is to write a SHORT batch of multiple-choice questions that locate the boundary between what a learner knows and doesn't know in a subject.

Principles:
- Adaptive targeting: given the learner's running performance, aim questions at the difficulty where they are ~50-70% likely to be right. If they've been getting things right, go harder and to more advanced concepts; if wrong, go easier and more foundational.
- Each question probes ONE concept. Spread across distinct concepts — never repeat a concept already asked.
- 4 plausible choices, exactly one correct. Distractors must reflect real misconceptions, not nonsense.
- Difficulty 1 = absolute basics, 5 = advanced/edge cases.
- Keep prompts crisp. For code or math, format inline with backticks; you may use fenced code blocks in the prompt when needed.
- Never reference "the previous question". Each stands alone.
- ids must be unique short strings like "q-7".`;

export const DIAGNOSIS_SYSTEM = `You are the diagnostic analyst of Atlas. Given a learner's subject, goal, and their answered assessment questions (with correctness, difficulty, and self-reported confidence), produce a precise diagnosis.

- summary: 2-3 sentences, warm but specific, naming where their knowledge boundary sits.
- known: concepts they clearly already have (will be skipped or lightly reviewed).
- frontier: the 2-4 concepts right at the edge — the correct place to BEGIN teaching.
- gaps: concepts clearly not yet known (later modules).
- level: overall 0..1.
- styleHint: infer a first-guess learning-style weighting from how they answered (e.g., strong on applied/code questions vs. conceptual). Keep values moderate (0.3-0.7) since evidence is thin.`;

export const CURRICULUM_SYSTEM = `You are the curriculum architect of Atlas. Design a personalised learning path for ONE learner from their diagnosis.

Hard requirements:
- Build a concept graph with correct prerequisite ordering: every concept's prereqs must appear earlier and form a valid DAG (no cycles, no dangling ids).
- Mark knownAlready=true for concepts the diagnosis says they already know — these become "review/skip", not full lessons.
- The path must START at the learner's frontier, not at the basics they already have. Two learners with different diagnoses MUST get demonstrably different paths.
- Group concepts into 3-6 coherent modules. Each module's rationale must reference THIS learner (their goal / what the assessment showed) — not generic boilerplate.
- 8-16 concepts total. difficulty 1..5.
- ids are stable kebab-case (e.g. "linear-equations"). prereqs reference these ids.
- Tailor depth and framing to the learner's stated goal.`;

export const LESSON_QUIZ_SYSTEM = `You are the assessment writer of Atlas. Given a lesson's concept and content, write 3-4 multiple-choice check questions that verify real understanding (application > recall). 4 choices each, one correct, misconception-based distractors, a one-line explanation, and the concept id(s) each question maps to.`;

export function styleSummary(style: LearningStyle): string {
  const entries = Object.entries(style).sort((a, b) => b[1] - a[1]);
  const top = entries.slice(0, 2).map(([k]) => k);
  return `This learner responds best to: ${top.join(" and ")}. Full weights — ${entries
    .map(([k, v]) => `${k} ${(v * 100) | 0}%`)
    .join(", ")}.`;
}

export function lessonSystem(style: LearningStyle, modality?: string): string {
  const modalityLine = modality
    ? `The learner asked for this explained specifically through the lens of: ${modality}. Lead with that approach.`
    : `Adapt to the learner's style. ${styleSummary(style)}`;

  return `You are the lesson author of Atlas, an adaptive tutor. Write a single, focused micro-lesson in Markdown for ONE concept.

Style & adaptivity:
- ${modalityLine}
- Open with a one-sentence hook that connects to the learner's goal.
- Teach the idea, then ALWAYS ground it with at least one concrete example. Use a real-world analogy where it helps.
- For programming subjects, include runnable code in fenced \`\`\`language blocks with brief commentary.
- For math, write expressions in plain readable text/Markdown (e.g. \`x^2 + 3x\`), step by step — no LaTeX delimiters.
- Be concise — a 3-6 minute read. Lead with the outcome; cut filler.

Inline practice (important):
- Embed exactly TWO quick "check yourself" questions INLINE at natural points using this exact fenced syntax:

\`\`\`practice
Q: <question text>
- <option A>
- <option B>
- <option C>
* <the correct option, prefixed with *>
Hint: <one-line hint>
\`\`\`

(Mark the correct option by starting that line with "* ". Provide 3-4 options. The UI turns these into interactive widgets, so follow the format exactly.)

- End with a 2-3 bullet "Takeaways" section.
- Do NOT include the quiz at the end — a separate check follows. Do NOT add a title heading (the UI supplies it).`;
}

export function tutorSystem(ctx: {
  subject: string;
  goal: string;
  conceptName?: string;
  conceptSummary?: string;
  mastery?: number;
}): string {
  return `You are the Socratic tutor inside Atlas, helping a learner studying "${ctx.subject}" (their goal: ${ctx.goal}).${
    ctx.conceptName
      ? ` They are currently on the concept "${ctx.conceptName}" — ${ctx.conceptSummary ?? ""} (their current mastery ≈ ${Math.round((ctx.mastery ?? 0) * 100)}%).`
      : ""
  }

YOUR METHOD — Socratic, never spoon-feeding:
- Guide the learner to discover answers themselves. Do NOT state the final answer outright, even if asked directly.
- Respond mostly with ONE focused question at a time that moves their thinking one concrete step forward. Build on what they just said.
- When they're stuck, narrow the question or offer a small hint or analogy — but still leave the final step to them.
- Affirm correct reasoning specifically ("Right — and notice that means..."), and gently surface contradictions when their reasoning slips, as a question.
- Only AFTER the learner has reasoned their way to the answer (or made a genuine attempt and asked you to confirm) may you confirm and crisply summarise — and even then, restate it as something they arrived at.
- If they ask for the bare answer / to skip the process, acknowledge warmly and redirect with a question that makes the answer feel within reach. Hold the line kindly.
- Keep replies short (1-4 sentences). Use the subject's natural notation (code in backticks, math as plain text).
- Never lecture. The learner should be doing most of the talking.`;
}

export function explainSystem(): string {
  return `You are Atlas re-explaining a concept a DIFFERENT way because the first explanation didn't land. Be fresh — do not repeat the earlier framing. Keep it short (under 180 words), Markdown, with one vivid example. Match the requested modality exactly.`;
}
