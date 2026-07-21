const TOKEN_KEY = "fevergate_assess_token";

export function getStoredAssessToken(): string | null {
  if (typeof window === "undefined") return null;
  return sessionStorage.getItem(TOKEN_KEY);
}

export function setStoredAssessToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearStoredAssessToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function assessAuthHeaders(): Record<string, string> {
  const token = getStoredAssessToken();
  return token ? { "X-FeverGate-Assess-Token": token } : {};
}
