"use client";

export function InvitationOptions({ticketUrl, setTicketUrl, showNames, setShowNames}: {
  ticketUrl: string; setTicketUrl: (value: string) => void;
  showNames: boolean; setShowNames: (value: boolean) => void;
}) {
  return <div className="invitation-options full">
    <label className="field"><span>Lien de billetterie <i>optionnel</i></span><input type="url" pattern="https://.*" maxLength={2000} placeholder="https://…" value={ticketUrl} onChange={event=>setTicketUrl(event.target.value)} /><small>Pour une soirée, un concert ou une activité. Chacun réserve sur le site indiqué.</small></label>
    <label className="names-option"><input type="checkbox" checked={showNames} onChange={event=>setShowNames(event.target.checked)} /><span><b>Montrer les prénoms disponibles par date</b><small>Les personnes ayant le lien verront qui est disponible. Les coordonnées restent privées. Tu peux désactiver cette option.</small></span></label>
  </div>;
}

export function TicketLink({url}: {url?: string | null}) {
  if (!url) return null;
  let parsed: URL;
  try { parsed = new URL(url); } catch { return null; }
  if(parsed.protocol !== "https:" || parsed.username || parsed.password) return null;
  return <aside className="ticket-link"><div><b>Un billet à prendre ?</b><p>Répondre sur BIMA ne réserve pas ta place. Chacun achète son billet sur la billetterie.</p><small>Site indiqué par l’organisateur : {parsed.hostname}</small></div><a href={url} target="_blank" rel="noopener noreferrer">Voir les billets ↗<span className="sr-only"> (nouvel onglet)</span></a></aside>;
}

export function AvailableNames({names}: {names?: string[]}) {
  if (!names?.length) return null;
  const visible = names.slice(0,3);
  return <small className="available-names">{visible.join(", ")}{names.length > 3 ? ` et ${names.length-3} autre${names.length>4 ? "s" : ""}` : ""} · disponible{names.length>1 ? "s" : ""}</small>;
}
