import "server-only";

import { createHmac, timingSafeEqual } from "crypto";

const TOKEN_TTL_MS = 8 * 60 * 60 * 1000;

export function isAssessPinRequired(): boolean {
  return Boolean(process.env.FEVERGATE_ASSESS_PIN?.trim());
}

export function verifyAssessPin(pin: string): boolean {
  const expected = process.env.FEVERGATE_ASSESS_PIN?.trim();
  if (!expected) return true;
  const supplied = pin.trim();
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export function issueAssessToken(): string {
  const secret = process.env.FEVERGATE_ASSESS_PIN?.trim() || "open";
  const expires = Date.now() + TOKEN_TTL_MS;
  const expiresStr = String(expires);
  const sig = createHmac("sha256", secret).update(expiresStr).digest("hex");
  return `${expiresStr}.${sig}`;
}

export function verifyAssessToken(token: string | null | undefined): boolean {
  if (!isAssessPinRequired()) return true;
  if (!token) return false;

  const [expiresStr, sig] = token.split(".");
  const expires = Number(expiresStr);
  if (!expiresStr || !sig || Number.isNaN(expires) || Date.now() > expires) {
    return false;
  }

  const secret = process.env.FEVERGATE_ASSESS_PIN!.trim();
  const expected = createHmac("sha256", secret).update(expiresStr).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
  } catch {
    return false;
  }
}

export function readAssessTokenFromRequest(request: Request): string | null {
  return request.headers.get("X-FeverGate-Assess-Token");
}

export function assertAssessAuthorized(request: Request): void {
  if (!verifyAssessToken(readAssessTokenFromRequest(request))) {
    throw new Error("Unauthorized: valid worker PIN required");
  }
}
