import { NextResponse } from "next/server";

import {
  isAssessPinRequired,
  issueAssessToken,
  verifyAssessPin,
} from "@/lib/fevergate/assess-auth";

export async function POST(request: Request) {
  if (!isAssessPinRequired()) {
    return NextResponse.json({ token: issueAssessToken(), required: false });
  }

  const body = await request.json();
  const pin = typeof body.pin === "string" ? body.pin : "";

  if (!verifyAssessPin(pin)) {
    return NextResponse.json({ error: "Invalid PIN" }, { status: 401 });
  }

  return NextResponse.json({ token: issueAssessToken(), required: true });
}
