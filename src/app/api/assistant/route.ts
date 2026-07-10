import { NextResponse } from "next/server";

export const runtime = "nodejs";

const GEMINI_MODEL = process.env.GEMINI_MODEL ?? "gemini-2.5-flash";
const GEMINI_ENDPOINT = (model: string) =>
  `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const SYSTEM_INSTRUCTION = `You are "FeverGate Assistant", a decision-support aid for frontline health workers in resource-limited border clinics in Myanmar. You support febrile-patient triage.

STRICT RULES:
- You are a triage AID, not a doctor. Never give a definitive diagnosis.
- Never override the app's triage decision (REFER / TREAT & MONITOR / TREAT). If danger signs are present or the app says REFER, always reinforce urgent referral / teleconsultation.
- When in doubt, advise referral and teleconsultation. Patient safety first.
- Base guidance on WHO / IMCI and national Myanmar protocols. Do not invent specific drug doses; defer exact dosing to protocols and teleconsultation.
- Keep answers short, concrete, and practical for a busy clinic (a few sentences or short bullets).
- Reply in the SAME language the health worker used. Default to Burmese (Myanmar) if unclear. Use clear, simple wording.
- Do not collect or ask for patient-identifying information.
- End any advice that involves a sick or deteriorating patient with a brief reminder to use clinical judgement and escalate if worsening.

You may explain danger signs, IMCI concepts, general supportive care, when to refer, and how to interpret the triage result. You must refuse non-medical or out-of-scope requests politely.`;

interface ChatMessage {
  role: "user" | "model";
  text: string;
}

function buildContents(messages: ChatMessage[], patientSummary?: string) {
  const contents = messages.map((m) => ({
    role: m.role,
    parts: [{ text: m.text }],
  }));

  if (patientSummary && contents.length > 0) {
    const last = contents[contents.length - 1];
    last.parts = [
      {
        text: `Current triage context (for grounding, do not repeat verbatim):\n${patientSummary}\n\nHealth worker question:\n${last.parts[0].text}`,
      },
    ];
  }
  return contents;
}

export async function POST(request: Request) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "AI assistant not configured. Set GEMINI_API_KEY." },
      { status: 503 },
    );
  }

  let body: { messages?: ChatMessage[]; patientSummary?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const messages = Array.isArray(body.messages) ? body.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "No messages provided." }, { status: 400 });
  }

  try {
    const response = await fetch(GEMINI_ENDPOINT(GEMINI_MODEL), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        contents: buildContents(messages, body.patientSummary),
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 800,
        },
      }),
    });

    if (!response.ok) {
      const detail = await response.text();
      return NextResponse.json(
        { error: "AI service error.", detail: detail.slice(0, 500) },
        { status: 502 },
      );
    }

    const data = await response.json();
    const reply: string | undefined =
      data?.candidates?.[0]?.content?.parts
        ?.map((p: { text?: string }) => p.text ?? "")
        .join("")
        .trim();

    if (!reply) {
      return NextResponse.json(
        { error: "The assistant could not produce a reply. Please rephrase." },
        { status: 502 },
      );
    }

    return NextResponse.json({ reply });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
