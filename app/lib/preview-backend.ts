// Preview must never silently fall back to the production database.
export function backendBaseUrl(fallback: string) {
  const configured = process.env.BIMA_API_URL;
  if (process.env.VERCEL_ENV === "preview" && (!configured || new URL(configured).hostname !== "msmnpgoggvogslvkfgwu.supabase.co")) {
    throw new Error("La preview doit être reliée à Preview BIMA.");
  }
  return (configured || fallback).replace(/\/$/, "");
}
