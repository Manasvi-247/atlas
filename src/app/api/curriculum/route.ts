import { NextRequest, NextResponse } from "next/server";
import { structured } from "@/lib/anthropic";
import { CURRICULUM_SYSTEM, curriculumSchema } from "@/lib/prompts";
import type { Diagnosis, RawConcept, RawModule } from "@/lib/types";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

interface Body {
  subject: string;
  goal: string;
  diagnosis: Diagnosis;
}

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as Body;
    const d = body.diagnosis;

    const user = `Subject: ${body.subject}
Learner's goal: ${body.goal}

Diagnosis:
- Overall level: ${Math.round((d.level ?? 0.4) * 100)}%
- Summary: ${d.summary ?? ""}
- Already knows: ${(d.known ?? []).join(", ") || "-"}
- Frontier (start teaching here): ${(d.frontier ?? []).join(", ") || "-"}
- Gaps (later): ${(d.gaps ?? []).join(", ") || "-"}

Design their personalised path. Begin at the frontier, mark already-known concepts knownAlready=true, and make every module rationale specific to this learner.`;

    const out = await structured<{ concepts: RawConcept[]; modules: RawModule[] }>({
      system: CURRICULUM_SYSTEM,
      user,
      schema: curriculumSchema as unknown as Record<string, unknown>,
      toolName: "submit_curriculum",
      maxTokens: 8000,
    });

    return NextResponse.json(out);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
