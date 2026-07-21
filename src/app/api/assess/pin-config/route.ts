import { NextResponse } from "next/server";

import { isAssessPinRequired } from "@/lib/fevergate/assess-auth";

export async function GET() {
  return NextResponse.json({ required: isAssessPinRequired() });
}
