export function ticketUrl(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value !== "string" || value.length > 2000) throw new Error("Ajoute un lien de billetterie HTTPS valide.");
  const raw = value.trim();
  if (!raw) return null;
  let url: URL;
  try { url = new URL(raw); } catch { throw new Error("Ajoute un lien de billetterie HTTPS valide."); }
  if (url.protocol !== "https:" || url.username || url.password || !url.hostname.includes(".") || /^(localhost|127\.|0\.|10\.|192\.168\.|169\.254\.|\[)/i.test(url.hostname)) {
    throw new Error("Ajoute un lien de billetterie public commençant par https://.");
  }
  return url.href;
}

export function availableFirstNames(enabled: boolean, participants: Array<{name: string; answers: Record<string, boolean>}>, dateId: string): string[] | undefined {
  if (!enabled) return undefined;
  return participants.filter(participant => participant.answers[dateId] === true)
    .map(participant => participant.name.trim().split(/\s+/)[0]).filter(Boolean);
}
