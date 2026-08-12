"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { addPropertyControls, ControlType } from "framer";

const DEFAULT_API =
  "https://ebilhzvgvinbpmmpezua.supabase.co/functions/v1/bima-api";

type AdminProps = {
  apiBaseUrl?: string;
};

type SectionKey =
  | "events"
  | "places"
  | "participants"
  | "votes"
  | "stageVotes"
  | "dates";
type DataRow = Record<string, unknown>;

type AdminData = {
  generatedAt: string;
  summary: Record<SectionKey, number>;
  events: DataRow[];
  places: DataRow[];
  dates: DataRow[];
  participants: DataRow[];
  votes: DataRow[];
  stageVotes: DataRow[];
};

type Column = {
  key: string;
  label: string;
  kind?: "date" | "status" | "boolean" | "link" | "role";
};

const sections: Array<{
  key: SectionKey;
  label: string;
  singular: string;
  icon: string;
}> = [
  { key: "events", label: "Sorties", singular: "Sortie", icon: "S" },
  { key: "places", label: "Étapes", singular: "Étape", icon: "E" },
  {
    key: "participants",
    label: "Participants",
    singular: "Participant",
    icon: "P",
  },
  { key: "votes", label: "Réponses", singular: "Réponse", icon: "R" },
  {
    key: "stageVotes",
    label: "Présence aux étapes",
    singular: "Présence",
    icon: "P",
  },
  {
    key: "dates",
    label: "Dates proposées",
    singular: "Date proposée",
    icon: "D",
  },
];

const columns: Record<SectionKey, Column[]> = {
  events: [
    { key: "title", label: "Sortie" },
    { key: "organizer_name", label: "Organisateur" },
    { key: "city", label: "Ville" },
    { key: "participant_count", label: "Participants" },
    { key: "max_places", label: "Places max." },
    { key: "budget_eur", label: "Budget" },
    { key: "response_deadline", label: "Date limite", kind: "date" },
    { key: "confirmed_date_id", label: "Statut", kind: "status" },
    { key: "created_at", label: "Créée le", kind: "date" },
    { key: "slug", label: "Identifiant" },
  ],
  places: [
    { key: "event_title", label: "Sortie" },
    { key: "position", label: "Ordre" },
    { key: "start_time", label: "Heure" },
    { key: "name", label: "Lieu" },
    { key: "category", label: "Catégorie" },
    { key: "address", label: "Adresse" },
    { key: "maps_url", label: "Google Maps", kind: "link" },
  ],
  participants: [
    { key: "name", label: "Participant" },
    { key: "role", label: "Rôle", kind: "role" },
    { key: "event_title", label: "Sortie" },
    { key: "created_at", label: "Ajouté le", kind: "date" },
    { key: "updated_at", label: "Modifié le", kind: "date" },
  ],
  votes: [
    { key: "participant_name", label: "Participant" },
    { key: "role", label: "Rôle", kind: "role" },
    { key: "event_title", label: "Sortie" },
    { key: "starts_at", label: "Date proposée", kind: "date" },
    { key: "available", label: "Disponible", kind: "boolean" },
    { key: "updated_at", label: "Répondu le", kind: "date" },
  ],
  stageVotes: [
    { key: "participant_name", label: "Participant" },
    { key: "role", label: "Rôle", kind: "role" },
    { key: "event_title", label: "Sortie" },
    { key: "stage_position", label: "Étape" },
    { key: "stage_name", label: "Lieu" },
    { key: "attending", label: "Présent", kind: "boolean" },
    { key: "updated_at", label: "Répondu le", kind: "date" },
  ],
  dates: [
    { key: "event_title", label: "Sortie" },
    { key: "position", label: "Ordre" },
    { key: "starts_at", label: "Date et heure", kind: "date" },
    { key: "available_count", label: "Disponibles" },
    { key: "response_count", label: "Réponses" },
    { key: "confirmed", label: "Confirmée", kind: "boolean" },
  ],
};

function formatDate(value: unknown) {
  if (!value) return "—";
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return String(value);
  return new Intl.DateTimeFormat("fr-FR", {
    dateStyle: "medium",
    timeStyle: String(value).includes("T") ? "short" : undefined,
  }).format(date);
}

function Cell({ column, value }: { column: Column; value: unknown }) {
  if (column.kind === "date") return <>{formatDate(value)}</>;
  if (column.kind === "status") {
    const confirmed = Boolean(value);
    return (
      <span className={`badge ${confirmed ? "success" : "pending"}`}>
        {confirmed ? "Confirmée" : "Votes en cours"}
      </span>
    );
  }
  if (column.kind === "boolean") {
    const enabled = Number(value) === 1 || value === true;
    return (
      <span className={`answer ${enabled ? "yes" : "no"}`}>
        {enabled ? "Oui" : "Non"}
      </span>
    );
  }
  if (column.kind === "role") {
    return (
      <span className="role">
        {value === "organizer" ? "Organisateur" : "Invité"}
      </span>
    );
  }
  if (column.kind === "link" && value) {
    return (
      <a href={String(value)} target="_blank" rel="noreferrer">
        Ouvrir ↗
      </a>
    );
  }
  if (column.key === "budget_eur") {
    return <>{value === null || value === undefined ? "—" : `${value} €`}</>;
  }
  return <>{value === null || value === undefined || value === "" ? "—" : String(value)}</>;
}

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 */
export default function BimaAdmin({
  apiBaseUrl = DEFAULT_API,
}: AdminProps) {
  const [token, setToken] = useState("");
  const [data, setData] = useState<AdminData | null>(null);
  const [active, setActive] = useState<SectionKey>("events");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function loadData(key: string) {
    if (!key.trim()) {
      setError("Saisissez votre clé administrateur.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/api/admin/data`;
      const response = await fetch(endpoint, {
        headers: { Authorization: `Bearer ${key.trim()}` },
        cache: "no-store",
      });
      const contentType = response.headers.get("content-type") || "";
      const payload = contentType.includes("application/json")
        ? ((await response.json()) as AdminData & { error?: string })
        : ({
            error:
              response.status === 404
                ? "La route administrateur n’est pas encore publiée sur le backend BIMA."
                : `Le backend a renvoyé une réponse invalide (${response.status}).`,
          } as AdminData & { error?: string });
      if (!response.ok) {
        throw new Error(payload.error || "Accès refusé.");
      }
      window.sessionStorage.setItem("bima:admin", key.trim());
      setToken(key.trim());
      setData(payload);
    } catch (reason) {
      window.sessionStorage.removeItem("bima:admin");
      setData(null);
      setError(
        reason instanceof Error
          ? reason.message
          : "Impossible de charger les données.",
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const saved = window.sessionStorage.getItem("bima:admin");
    if (saved) {
      setToken(saved);
      void loadData(saved);
    }
  }, [apiBaseUrl]);

  function submit(event: FormEvent) {
    event.preventDefault();
    void loadData(token);
  }

  function lock() {
    window.sessionStorage.removeItem("bima:admin");
    setData(null);
    setToken("");
    setError("");
  }

  const rows = useMemo(() => {
    if (!data) return [];
    const source = data[active] as DataRow[];
    const normalized = query.trim().toLocaleLowerCase("fr");
    if (!normalized) return source;
    return source.filter((row) =>
      Object.values(row).some((value) =>
        String(value ?? "")
          .toLocaleLowerCase("fr")
          .includes(normalized),
      ),
    );
  }, [active, data, query]);

  const current = sections.find((section) => section.key === active)!;

  if (!data) {
    return (
      <main className="login-page">
        <style>{styles}</style>
        <section className="login-card">
          <a className="brand" href="/">
            bi<span>ma</span><i>.</i>
          </a>
          <div className="lock-mark">⌁</div>
          <small>ESPACE ADMINISTRATEUR</small>
          <h1>Accéder aux données</h1>
          <p>
            Consulte les sorties, les étapes, les participants et toutes les
            réponses enregistrées.
          </p>
          <form onSubmit={submit}>
            <label htmlFor="admin-key">Clé administrateur</label>
            <input
              id="admin-key"
              type="password"
              autoComplete="current-password"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              placeholder="••••••••••••••••"
              autoFocus
            />
            {error && <div className="login-error">{error}</div>}
            <button disabled={loading} type="submit">
              {loading ? "Vérification…" : "Ouvrir le tableau →"}
            </button>
          </form>
          <small className="privacy-note">
            Accès protégé · la clé reste uniquement dans cette session
          </small>
        </section>
      </main>
    );
  }

  return (
    <main className="admin-shell">
      <style>{styles}</style>
      <aside className="sidebar">
        <a className="brand" href="/">
          bi<span>ma</span><i>.</i>
        </a>
        <div className="side-title">
          <span>▦</span>
          <b>Données</b>
        </div>
        <nav>
          {sections.map((section) => (
            <button
              key={section.key}
              className={active === section.key ? "active" : ""}
              onClick={() => {
                setActive(section.key);
                setQuery("");
              }}
            >
              <span>{section.icon}</span>
              <b>{section.label}</b>
              <em>{data.summary[section.key]}</em>
            </button>
          ))}
        </nav>
        <button className="lock-button" onClick={lock}>
          Verrouiller l’accès
        </button>
      </aside>

      <section className="workspace">
        <header className="topbar">
          <div>
            <small>BASE BIMA</small>
            <h1>{current.label}</h1>
          </div>
          <div className="top-actions">
            <label className="search">
              <span>⌕</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Rechercher dans ${current.label.toLowerCase()}…`}
              />
            </label>
            <button onClick={() => void loadData(token)} disabled={loading}>
              {loading ? "Actualisation…" : "Actualiser"}
            </button>
          </div>
        </header>

        <div className="summary-grid">
          <article>
            <small>SORTIES</small>
            <strong>{data.summary.events}</strong>
            <span>créées au total</span>
          </article>
          <article>
            <small>PARTICIPANTS</small>
            <strong>{data.summary.participants}</strong>
            <span>personnes enregistrées</span>
          </article>
          <article>
            <small>RÉPONSES</small>
            <strong>{data.summary.votes}</strong>
            <span>disponibilités données</span>
          </article>
          <article>
            <small>DATES</small>
            <strong>{data.summary.dates}</strong>
            <span>propositions enregistrées</span>
          </article>
        </div>

        <section className="table-card">
          <div className="table-heading">
            <div>
              <h2>{current.label}</h2>
              <p>
                {rows.length} {rows.length > 1 ? "entrées affichées" : "entrée affichée"}
              </p>
            </div>
            <span>
              Mis à jour {formatDate(data.generatedAt).toLocaleLowerCase("fr")}
            </span>
          </div>
          <div className="table-scroll">
            <table>
              <thead>
                <tr>
                  {columns[active].map((column) => (
                    <th key={column.key}>{column.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, index) => (
                  <tr key={String(row.id || `${active}-${index}`)}>
                    {columns[active].map((column) => (
                      <td key={column.key}>
                        <Cell column={column} value={row[column.key]} />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            {!rows.length && (
              <div className="empty-state">
                <b>Aucune entrée trouvée</b>
                <span>Modifie la recherche ou crée une nouvelle sortie.</span>
              </div>
            )}
          </div>
        </section>
      </section>
    </main>
  );
}

const styles = `
*{box-sizing:border-box}.login-page,.admin-shell{width:100%;margin:0;background:#f4f1e8;color:#171816;font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}.brand{font-size:28px;font-weight:950;letter-spacing:-2.2px;color:#171816;text-decoration:none}.brand span{color:#e65e38}.brand i{color:#f18d62}.login-page{min-height:100vh;display:grid;place-items:center;padding:24px;background:radial-gradient(circle at 15% 20%,rgba(230,94,56,.12),transparent 28%),#f4f1e8}.login-card{width:min(460px,100%);padding:42px;background:#fffdf8;border:1px solid #d9d5ca;border-radius:28px;box-shadow:0 28px 80px rgba(38,33,26,.13)}.lock-mark{width:62px;height:62px;border-radius:50%;display:grid;place-items:center;background:#171816;color:white;font-size:30px;margin:42px 0 22px}.login-card>small{font-size:11px;font-weight:900;letter-spacing:.13em;color:#e65e38}.login-card h1{font-size:42px;line-height:1;letter-spacing:-.055em;margin:12px 0 16px}.login-card p{font-size:17px;line-height:1.5;color:#6b6962;margin:0 0 30px}.login-card form{display:grid;gap:10px}.login-card label{font-size:13px;font-weight:800}.login-card input{width:100%;padding:15px 16px;border:1px solid #d9d5ca;border-radius:12px;background:white;font:inherit;outline:none}.login-card input:focus{border-color:#e65e38;box-shadow:0 0 0 3px rgba(230,94,56,.12)}.login-card button,.top-actions>button{border:0;background:#171816;color:white;border-radius:999px;padding:15px 20px;font-weight:850;cursor:pointer}.login-card button:disabled,.top-actions>button:disabled{opacity:.5}.login-error{padding:12px 14px;border-radius:10px;background:#fff0ed;color:#a93b25;font-size:13px}.privacy-note{display:block;text-align:center;color:#8a877e!important;letter-spacing:0!important;margin-top:22px}.admin-shell{min-height:100vh;display:grid;grid-template-columns:260px minmax(0,1fr)}.sidebar{position:sticky;top:0;height:100vh;padding:28px 20px;background:#171816;color:white;display:flex;flex-direction:column}.sidebar .brand{color:white;margin:0 10px 42px}.side-title{display:flex;align-items:center;gap:10px;padding:0 12px 12px;color:#aaa79f;font-size:12px;text-transform:uppercase;letter-spacing:.1em}.sidebar nav{display:grid;gap:5px}.sidebar nav button{width:100%;display:grid;grid-template-columns:30px 1fr auto;align-items:center;gap:8px;padding:12px;border:0;border-radius:11px;background:transparent;color:#d8d5cd;text-align:left;cursor:pointer}.sidebar nav button>span{width:28px;height:28px;display:grid;place-items:center;border:1px solid #403f3b;border-radius:8px;font-size:11px}.sidebar nav button b{font-size:14px}.sidebar nav button em{font-style:normal;font-size:11px;background:#2b2c29;padding:4px 7px;border-radius:99px}.sidebar nav button:hover,.sidebar nav button.active{background:#302e2a;color:white}.sidebar nav button.active>span{background:#e65e38;border-color:#e65e38}.sidebar nav button.active em{background:#494641}.lock-button{margin-top:auto;border:1px solid #45433f;background:transparent;color:#bbb8b0;border-radius:10px;padding:12px;font-weight:700;cursor:pointer}.workspace{min-width:0;padding:34px clamp(22px,4vw,58px) 70px}.topbar{display:flex;align-items:flex-end;justify-content:space-between;gap:24px;margin-bottom:28px}.topbar small{font-size:10px;font-weight:900;letter-spacing:.14em;color:#e65e38}.topbar h1{font-size:44px;letter-spacing:-.05em;margin:5px 0 0}.top-actions{display:flex;gap:10px;align-items:center}.search{display:flex;align-items:center;gap:8px;width:min(340px,38vw);background:#fffdf8;border:1px solid #d9d5ca;border-radius:999px;padding:0 15px}.search input{width:100%;border:0;background:transparent;padding:13px 0;font:inherit;outline:none}.top-actions>button{padding:13px 18px}.summary-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin-bottom:24px}.summary-grid article{padding:20px;background:#fffdf8;border:1px solid #d9d5ca;border-radius:16px}.summary-grid small{display:block;font-size:9px;font-weight:900;letter-spacing:.12em;color:#817e76}.summary-grid strong{display:block;font-size:35px;letter-spacing:-.05em;margin:7px 0}.summary-grid span{font-size:12px;color:#74716a}.table-card{background:#fffdf8;border:1px solid #d9d5ca;border-radius:20px;overflow:hidden;box-shadow:0 12px 40px rgba(43,38,31,.05)}.table-heading{display:flex;justify-content:space-between;align-items:center;padding:24px 26px;border-bottom:1px solid #e1ddd3}.table-heading h2{margin:0;font-size:22px}.table-heading p{margin:4px 0 0;color:#77746d;font-size:13px}.table-heading>span{font-size:11px;color:#8b887f}.table-scroll{overflow:auto}table{width:100%;border-collapse:collapse;min-width:900px}th{padding:13px 16px;background:#f2efe7;color:#6d6a63;font-size:10px;letter-spacing:.08em;text-align:left;white-space:nowrap}td{padding:15px 16px;border-top:1px solid #ece8df;font-size:13px;white-space:nowrap;max-width:320px;overflow:hidden;text-overflow:ellipsis}tbody tr:hover{background:#faf7ef}td a{color:#e65e38;font-weight:750;text-decoration:none}.badge,.role,.answer{display:inline-flex;align-items:center;border-radius:99px;padding:5px 9px;font-size:10px;font-weight:850}.badge.success,.answer.yes{background:#e2f3df;color:#267232}.badge.pending{background:#fff0d8;color:#936112}.answer.no{background:#f2efea;color:#77736c}.role{background:#ebeefa;color:#4b5aa6}.empty-state{padding:70px;text-align:center;color:#77746d;display:grid;gap:7px}.empty-state b{color:#171816}.empty-state span{font-size:13px}@media(max-width:1050px){.admin-shell{grid-template-columns:86px minmax(0,1fr)}.sidebar{padding:24px 12px}.sidebar .brand{font-size:20px;letter-spacing:-1.5px;margin:0 auto 38px}.side-title b,.sidebar nav button b,.sidebar nav button em,.lock-button{display:none}.side-title{justify-content:center;padding:0 0 12px}.sidebar nav button{display:grid;grid-template-columns:1fr;padding:9px}.sidebar nav button>span{margin:auto}.summary-grid{grid-template-columns:repeat(2,1fr)}}@media(max-width:720px){.admin-shell{display:block}.sidebar{position:static;height:auto;padding:16px;display:block}.sidebar .brand{display:inline-block;margin:0 0 16px}.side-title{display:none}.sidebar nav{display:flex;overflow-x:auto}.sidebar nav button{min-width:52px}.lock-button{display:block;margin:14px 0 0;width:100%}.workspace{padding:24px 14px 50px}.topbar{align-items:flex-start;flex-direction:column}.topbar h1{font-size:36px}.top-actions{width:100%}.search{width:100%}.summary-grid{grid-template-columns:1fr 1fr}.table-heading{align-items:flex-start;gap:10px;flex-direction:column}.login-card{padding:30px}.login-card h1{font-size:36px}}
`;

addPropertyControls(BimaAdmin, {
  apiBaseUrl: {
    type: ControlType.String,
    title: "API BIMA",
    defaultValue: DEFAULT_API,
  },
});
