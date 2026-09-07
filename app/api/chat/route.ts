import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { getCaseById } from "@/lib/cases";
import { buildSystemPrompt } from "@/lib/prompt";
import { ChatMessage } from "@/lib/types";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { caseId, stageId, messages } = body as {
    caseId: string;
    stageId: string;
    messages: ChatMessage[];
  };

  if (!caseId || !stageId || !Array.isArray(messages) || messages.length === 0) {
    return NextResponse.json({ error: "Missing caseId, stageId, or messages" }, { status: 400 });
  }

  const caseData = getCaseById(caseId);
  if (!caseData) {
    return NextResponse.json({ error: "Unknown case" }, { status: 404 });
  }

  const stage = caseData.stages.find((s) => s.id === stageId);
  if (!stage) {
    return NextResponse.json({ error: "Unknown stage" }, { status: 404 });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "Server is missing ANTHROPIC_API_KEY. Set it in .env.local (dev) or your Vercel project's environment variables (prod)." },
      { status: 500 }
    );
  }

  const anthropic = new Anthropic({ apiKey });

  try {
    const response = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 400,
      system: buildSystemPrompt(caseData, stage),
      messages: messages.map((m) => ({ role: m.role, content: m.content })),
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const reply = textBlock && textBlock.type === "text" ? textBlock.text : "";

    return NextResponse.json({ reply });
  } catch (err) {
    console.error("Anthropic API error:", err);
    return NextResponse.json({ error: "Failed to reach the model. Try again." }, { status: 502 });
  }
}
