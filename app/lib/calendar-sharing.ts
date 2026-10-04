export function calendarPath(slug: string) {
  return `/api/events/${encodeURIComponent(slug)}/calendar`;
}

export function calendarShareData(title: string, dateLabel: string, url: string) {
  return {
    title: `Calendrier · ${title}`,
    text: `C’est calé ! 🎉\n${title}\n${dateLabel}\n\nAjoute la sortie à ton calendrier avec ce lien :`,
    url,
  };
}

export async function shareCalendar(
  data: ReturnType<typeof calendarShareData>,
  share?: (data: ReturnType<typeof calendarShareData>) => Promise<void>,
): Promise<"shared" | "cancelled" | "fallback"> {
  if (!share) return "fallback";
  try {
    await share(data);
    return "shared";
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") return "cancelled";
    return "fallback";
  }
}
