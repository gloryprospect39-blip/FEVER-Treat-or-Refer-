export function cn(...classes: (string | false | null | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}

/** Splits Myanmar text into individual sentences (delimited by "။") so results
 *  can be displayed one sentence per line instead of as a single paragraph. */
export function toSentences(text: string): string[] {
  return text
    .split("။")
    .map((s) => s.trim())
    .filter(Boolean)
    .map((s) => `${s}။`);
}
