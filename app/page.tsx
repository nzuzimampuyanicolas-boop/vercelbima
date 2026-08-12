"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useState } from "react";

type Mode = "home" | "create" | "share" | "respond" | "saved" | "manage" | "confirmed";

const SCREEN_TITLES: Record<Mode, string> = {
  home: "",
  create: "Créer une sortie",
  share: "Inviter le groupe",
  respond: "Répondre à l’invitation",
  saved: "Réponse enregistrée",
  manage: "Gérer la sortie",
  confirmed: "Sortie confirmée",
};

type PlaceData = {
  name: string;
  rating: string;
  ratingLabel: string;
  price?: string;
  address: string;
  category: string;
  hours: string;
  image: string;
};

type EventPlace = PlaceData & {
  id: string;
  position: number;
  startTime: string | null;
  mapsUrl: string;
  attendingCount: number;
};

type EventDate = {
  id: string;
  position: number;
  startsAt: string;
  endsAt: string | null;
  availableCount: number;
};

type Participant = {
  id: string;
  name: string;
  role: "organizer" | "guest";
  answers: Record<string, boolean>;
  stageAnswers: Record<string, boolean>;
};

type BimaEvent = {
  slug: string;
  eventType: "outing" | "stay";
  organizerName: string;
  title: string;
  city: string;
  maxPlaces: number;
  budgetEur: number | null;
  responseDeadline: string | null;
  confirmedDateId: string | null;
  status: "collecting" | "confirmed";
  createdAt: string;
  places: EventPlace[];
  dates: EventDate[];
};

type EventResponse = {
  event: BimaEvent;
  summary: { participantCount: number; guestCount: number };
  manage: boolean;
  me?: Participant;
  voters?: Participant[];
  notificationPreferences?: NotificationPreferences;
};

type NotificationPreferences = {
  newResponses: boolean;
  reminders: boolean;
  active: boolean;
};

type CreatedEventResponse = EventResponse & {
  manageToken: string;
  organizerParticipantToken: string;
  manageShortCode: string;
  organizerParticipantShortCode: string;
  sharePath: string;
  managePath: string;
  organizerEmail: string;
  emailSent: boolean;
  emailWarning?: string;
};

type ShortEventResponse = EventResponse & {
  manageShortCode?: string;
  participantShortCode: string;
};

type PlaceDraft = {
  name: string;
  city: string;
  mapsUrl: string;
  data: PlaceData | null;
  loading: boolean;
  error: string;
};

type DateDraft = { id: string; date: string; time: string; endDate: string };

type EventUpdateInput = {
  title: string;
  maxPlaces: number;
  budgetEur: number | null;
  responseDeadline: string | null;
  places: Array<{ id: string; name: string; address: string; mapsUrl: string }>;
};

const initialPlace = (): PlaceDraft => ({
  name: "",
  city: "",
  mapsUrl: "",
  data: null,
  loading: false,
  error: "",
});

async function readPayload<T>(response: Response): Promise<T> {
  const payload = (await response.json().catch(() => null)) as (T & { error?: string }) | null;
  if (!response.ok) throw new Error(payload?.error || "Une erreur est survenue. Réessaie dans quelques instants.");
  if (!payload) throw new Error("Réponse du serveur invalide.");
  return payload;
}

function formatDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat("fr-FR", options || {
    weekday: "short",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

function dateParts(value: string) {
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat("fr-FR", { weekday: "short" }).format(date).replace(".", "").toUpperCase(),
    number: new Intl.DateTimeFormat("fr-FR", { day: "2-digit" }).format(date),
    month: new Intl.DateTimeFormat("fr-FR", { month: "short" }).format(date).replace(".", "").toUpperCase(),
    time: new Intl.DateTimeFormat("fr-FR", { hour: "2-digit", minute: "2-digit" }).format(date),
  };
}

function formatEventDate(date: EventDate, eventType: BimaEvent["eventType"], compact = false) {
  if (eventType === "stay" && date.endsAt) {
    const options: Intl.DateTimeFormatOptions = compact
      ? { day: "numeric", month: "short", timeZone: "UTC" }
      : { weekday: "short", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" };
    return `Du ${formatDate(date.startsAt, options)} au ${formatDate(date.endsAt, options)}`;
  }
  return formatDate(date.startsAt, compact ? { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" } : undefined);
}

function stayDateParts(value: string) {
  const date = new Date(value);
  return {
    day: new Intl.DateTimeFormat("fr-FR", { weekday: "short", timeZone: "UTC" }).format(date).replace(".", "").toUpperCase(),
    number: new Intl.DateTimeFormat("fr-FR", { day: "2-digit", timeZone: "UTC" }).format(date),
    month: new Intl.DateTimeFormat("fr-FR", { month: "short", timeZone: "UTC" }).format(date).replace(".", "").toUpperCase(),
  };
}

function absoluteUrl(path: string) {
  return typeof window === "undefined" ? path : new URL(path, window.location.origin).toString();
}

function eventSharePath(slug: string) {
  return `/e/${encodeURIComponent(slug)}`;
}

type BimaAppProps = {
  initialEventSlug?: string;
  initialManageShortCode?: string;
  initialParticipantShortCode?: string;
};

export function BimaApp({ initialEventSlug = "", initialManageShortCode = "", initialParticipantShortCode = "" }: BimaAppProps = {}) {
  const [mode, setMode] = useState<Mode>("home");
  const [initializing, setInitializing] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [payload, setPayload] = useState<EventResponse | null>(null);
  const [createdPayload, setCreatedPayload] = useState<CreatedEventResponse | null>(null);
  const [manageToken, setManageToken] = useState("");
  const [participantToken, setParticipantToken] = useState("");
  const [manageShortCode, setManageShortCode] = useState("");
  const [participantShortCode, setParticipantShortCode] = useState("");
  const [name, setName] = useState("");
  const [availableDateIds, setAvailableDateIds] = useState<string[]>([]);
  const [availablePlaceIds, setAvailablePlaceIds] = useState<string[]>([]);
  const [copied, setCopied] = useState(false);

  const showToast = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2600);
  }, []);

  const applyPersonalAnswers = useCallback((eventPayload: EventResponse) => {
    const me = eventPayload.me;
    setName(me?.name || "");
    setAvailableDateIds(me ? Object.entries(me.answers).filter(([, answer]) => answer).map(([id]) => id) : []);
    setAvailablePlaceIds(me ? Object.entries(me.stageAnswers).filter(([, answer]) => answer).map(([id]) => id) : []);
  }, []);

  const loadEvent = useCallback(async (slug: string, manager = "", personal = "") => {
    setBusy(true);
    setError("");
    try {
      const search = new URLSearchParams();
      if (manager) search.set("manage", manager);
      if (personal || manager) search.set("participant", personal || manager);
      const response = await fetch(`/api/events/${encodeURIComponent(slug)}?${search.toString()}`, { cache: "no-store" });
      const eventPayload = await readPayload<EventResponse | null>(response);
      if (!eventPayload?.event) throw new Error("Cette sortie n’existe pas ou n’est plus disponible.");
      if (manager && !eventPayload.manage) throw new Error("Ce lien de gestion est invalide.");
      setPayload(eventPayload);
      setManageToken(manager);
      setParticipantToken(personal || manager);
      setManageShortCode("");
      setParticipantShortCode("");
      applyPersonalAnswers(eventPayload);
      setMode(manager ? "manage" : eventPayload.event.status === "confirmed" ? "confirmed" : "respond");
    } catch (loadError) {
      setPayload(null);
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger cette sortie.");
    } finally {
      setBusy(false);
      setInitializing(false);
    }
  }, [applyPersonalAnswers]);

  const loadShort = useCallback(async (kind: "manage" | "participant", code: string) => {
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/short/${kind}/${encodeURIComponent(code)}`, { cache: "no-store" });
      const eventPayload = await readPayload<ShortEventResponse>(response);
      if (!eventPayload?.event) throw new Error("Ce lien court n’est plus disponible.");
      setPayload(eventPayload);
      setManageToken("");
      setParticipantToken("");
      setManageShortCode("");
      setParticipantShortCode("");
      setManageShortCode(eventPayload.manageShortCode || "");
      setParticipantShortCode(eventPayload.participantShortCode || "");
      applyPersonalAnswers(eventPayload);
      setMode(kind === "manage" ? "manage" : eventPayload.event.status === "confirmed" ? "confirmed" : "respond");
    } catch (loadError) {
      setPayload(null);
      setError(loadError instanceof Error ? loadError.message : "Impossible de charger ce lien court.");
    } finally {
      setBusy(false);
      setInitializing(false);
    }
  }, [applyPersonalAnswers]);

  const syncWithUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const slug = params.get("event") || "";
    const manager = params.get("manage") || "";
    const personalFromUrl = params.get("participant") || "";
    if (!slug) {
      setPayload(null);
      setCreatedPayload(null);
      setManageToken("");
      setParticipantToken("");
      setError("");
      setMode("home");
      setInitializing(false);
      return;
    }
    const savedPersonal = window.localStorage.getItem(`bima:participant:${slug}`) || "";
    void loadEvent(slug, manager, personalFromUrl || savedPersonal);
  }, [loadEvent]);

  useEffect(() => {
    const initialize = () => {
      if (initialManageShortCode) return void loadShort("manage", initialManageShortCode);
      if (initialParticipantShortCode) return void loadShort("participant", initialParticipantShortCode);
      if (initialEventSlug) return void loadEvent(initialEventSlug);
      syncWithUrl();
    };
    const timer = window.setTimeout(initialize, 0);
    if (!initialManageShortCode && !initialParticipantShortCode && !initialEventSlug) {
      window.addEventListener("popstate", syncWithUrl);
    }
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("popstate", syncWithUrl);
    };
  }, [initialEventSlug, initialManageShortCode, initialParticipantShortCode, loadEvent, loadShort, syncWithUrl]);

  const goHome = () => {
    window.history.pushState({}, "", "/");
    setPayload(null);
    setCreatedPayload(null);
    setManageToken("");
    setParticipantToken("");
    setManageShortCode("");
    setParticipantShortCode("");
    setError("");
    setMode("home");
  };

  const goCreate = () => {
    window.history.pushState({}, "", "/");
    setError("");
    setMode("create");
  };

  const copyText = async (text: string, message = "Lien copié") => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
    } else {
      const textarea = document.createElement("textarea");
      textarea.value = text;
      textarea.style.position = "fixed";
      textarea.style.opacity = "0";
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand("copy");
      textarea.remove();
    }
    setCopied(true);
    showToast(message);
    window.setTimeout(() => setCopied(false), 1800);
  };

  const handleCreated = (created: CreatedEventResponse) => {
    window.localStorage.setItem(`bima:manage:${created.event.slug}`, created.manageToken);
    window.localStorage.setItem(`bima:participant:${created.event.slug}`, created.organizerParticipantToken);
    window.localStorage.setItem(`bima:manage-short:${created.event.slug}`, created.manageShortCode);
    window.localStorage.setItem(`bima:participant-short:${created.event.slug}`, created.organizerParticipantShortCode);
    window.history.replaceState({}, "", created.managePath);
    setCreatedPayload(created);
    setPayload(created);
    setManageToken(created.manageToken);
    setParticipantToken(created.organizerParticipantToken);
    setManageShortCode(created.manageShortCode);
    setParticipantShortCode(created.organizerParticipantShortCode);
    applyPersonalAnswers(created);
    setMode("share");
    showToast("Sortie créée · conserve bien ton lien privé");
  };

  const submitVote = async () => {
    if (!payload) return;
    if (!name.trim()) {
      setError("Indique ton prénom avant de valider.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(payload.event.slug)}/votes`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          participantToken,
          participantShortCode,
          manageShortCode,
          availableDateIds,
          availablePlaceIds,
        }),
      });
      const updated = await readPayload<EventResponse & { participantToken: string; participantShortCode: string; manageShortCode?: string }>(response);
      const nextToken = updated.participantToken;
      const nextShortCode = updated.participantShortCode;
      window.localStorage.setItem(`bima:participant:${payload.event.slug}`, nextToken);
      window.localStorage.setItem(`bima:participant-short:${payload.event.slug}`, nextShortCode);
      setParticipantToken(nextToken);
      setParticipantShortCode(nextShortCode);
      if (updated.manageShortCode) {
        setManageShortCode(updated.manageShortCode);
        window.localStorage.setItem(`bima:manage-short:${payload.event.slug}`, updated.manageShortCode);
      }
      setPayload(updated);
      applyPersonalAnswers(updated);
      if (manageToken || manageShortCode) {
        showToast("Ton vote organisateur est enregistré");
        setMode("manage");
      } else {
        const personalPath = `/p/${encodeURIComponent(nextShortCode)}`;
        window.history.replaceState({}, "", personalPath);
        setMode("saved");
      }
    } catch (voteError) {
      setError(voteError instanceof Error ? voteError.message : "Impossible d’enregistrer ta réponse.");
    } finally {
      setBusy(false);
    }
  };

  const confirmDate = async (dateId: string) => {
    if (!payload || (!manageToken && !manageShortCode)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(payload.event.slug)}/confirm`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ manageToken, manageShortCode, dateId }),
      });
      const updated = await readPayload<EventResponse>(response);
      setPayload(updated);
      showToast("La date est confirmée et le fichier calendrier est prêt");
    } catch (confirmError) {
      setError(confirmError instanceof Error ? confirmError.message : "Impossible de confirmer cette date.");
    } finally {
      setBusy(false);
    }
  };

  const updateEvent = async (input: EventUpdateInput) => {
    if (!payload || (!manageToken && !manageShortCode)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(payload.event.slug)}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ manageToken, manageShortCode, ...input }),
      });
      const updated = await readPayload<EventResponse>(response);
      setPayload(updated);
      applyPersonalAnswers(updated);
      showToast("Les informations de la sortie sont à jour");
    } catch (updateError) {
      setError(updateError instanceof Error ? updateError.message : "Impossible de modifier cette sortie.");
      throw updateError;
    } finally {
      setBusy(false);
    }
  };

  const updateNotificationPreferences = async (preferences: Pick<NotificationPreferences, "newResponses" | "reminders">) => {
    if (!payload || (!manageToken && !manageShortCode)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(payload.event.slug)}/notifications`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ manageToken, manageShortCode, ...preferences }),
      });
      const updated = await readPayload<EventResponse>(response);
      setPayload(updated);
      showToast("Tes préférences d’e-mail sont enregistrées");
    } catch (notificationError) {
      setError(notificationError instanceof Error ? notificationError.message : "Impossible de modifier les notifications.");
      throw notificationError;
    } finally {
      setBusy(false);
    }
  };

  const deleteCurrentEvent = async () => {
    if (!payload || (!manageToken && !manageShortCode)) return;
    if (!window.confirm("Supprimer définitivement cette sortie et toutes les réponses ? Cette action est irréversible.")) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(payload.event.slug)}/delete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ manageToken, manageShortCode }),
      });
      await readPayload<{ ok: true }>(response);
      window.localStorage.removeItem(`bima:manage:${payload.event.slug}`);
      window.localStorage.removeItem(`bima:participant:${payload.event.slug}`);
      window.localStorage.removeItem(`bima:manage-short:${payload.event.slug}`);
      window.localStorage.removeItem(`bima:participant-short:${payload.event.slug}`);
      window.history.replaceState({}, "", "/");
      setPayload(null);
      setManageToken("");
      setParticipantToken("");
      setManageShortCode("");
      setParticipantShortCode("");
      setMode("home");
      showToast("La sortie et ses réponses ont été supprimées");
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : "Impossible de supprimer cette sortie.");
    } finally {
      setBusy(false);
    }
  };

  const deleteParticipant = async (participant: Participant) => {
    if (!payload || (!manageToken && !manageShortCode) || participant.role !== "guest") return;
    if (!window.confirm(`Retirer ${participant.name} de cette sortie ? Ses réponses et son lien personnel seront supprimés.`)) return;
    setBusy(true);
    setError("");
    try {
      const response = await fetch(`/api/events/${encodeURIComponent(payload.event.slug)}/participants/${encodeURIComponent(participant.id)}/delete`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ manageToken, manageShortCode }),
      });
      const updated = await readPayload<EventResponse>(response);
      setPayload(updated);
      applyPersonalAnswers(updated);
      showToast(`${participant.name} a été retiré·e de la sortie`);
    } catch (participantError) {
      setError(participantError instanceof Error ? participantError.message : "Impossible de retirer ce participant.");
    } finally {
      setBusy(false);
    }
  };

  const screenTitle = mode === "respond" && payload?.me
    ? "Modifier ma réponse"
    : SCREEN_TITLES[mode];

  if (initializing) return <LoadingPage />;

  return (
    <main className="app-shell">
      {mode !== "home" && (
        <header className="topbar">
          <button className="brand" onClick={goHome} aria-label="Accueil BIMA">
            <Image src="/bima-logo.svg" alt="" width={46} height={46} priority />
            <span>BIMA</span>
          </button>
          <div className="topbar-title">{screenTitle}</div>
          <button className="icon-button" onClick={goHome} aria-label="Revenir à l’accueil">×</button>
        </header>
      )}

      {error && !payload && mode !== "create" ? (
        <ErrorPage message={error} onHome={goHome} />
      ) : (
        <>
          {mode === "home" && <HomeLanding onCreate={goCreate} />}
          {mode === "create" && <CreatePage onCreated={handleCreated} onError={setError} globalError={error} />}
          {mode === "share" && createdPayload && (
            <SharePage
              payload={createdPayload}
              copied={copied}
              onCopy={copyText}
              onManage={() => setMode("manage")}
            />
          )}
          {mode === "respond" && payload && (
            <RespondPage
              payload={payload}
              name={name}
              setName={setName}
              availableDateIds={availableDateIds}
              setAvailableDateIds={setAvailableDateIds}
              availablePlaceIds={availablePlaceIds}
              setAvailablePlaceIds={setAvailablePlaceIds}
              busy={busy}
              error={error}
              onSubmit={submitVote}
            />
          )}
          {mode === "saved" && payload && (
            <SavedPage payload={payload} participantToken={participantToken} participantShortCode={participantShortCode} copied={copied} onCopy={copyText} />
          )}
          {mode === "manage" && payload && (
            <ManagePage
              payload={payload}
              name={name}
              availableDateIds={availableDateIds}
              setAvailableDateIds={setAvailableDateIds}
              availablePlaceIds={availablePlaceIds}
              setAvailablePlaceIds={setAvailablePlaceIds}
              busy={busy}
              error={error}
              copied={copied}
              onSaveVote={submitVote}
              onUpdate={updateEvent}
              onUpdateNotifications={updateNotificationPreferences}
              onConfirm={confirmDate}
              onCopy={copyText}
              onDeleteParticipant={deleteParticipant}
              onDelete={deleteCurrentEvent}
            />
          )}
          {mode === "confirmed" && payload && (
            <ConfirmedPage payload={payload} copied={copied} onCopy={copyText} />
          )}
        </>
      )}
      {toast && <div className="toast" role="status">{toast}</div>}
    </main>
  );
}

export default function Home() {
  return <BimaApp />;
}

function HomeLanding({ onCreate }: { onCreate: () => void }) {
  return (
    <section className="home-screen">
      <nav className="home-nav">
        <button className="brand" aria-label="Accueil BIMA">
          <Image src="/bima-logo.svg" alt="" width={52} height={52} priority />
          <span>BIMA</span>
        </button>
        <button className="nav-pill" onClick={onCreate}>Créer une sortie</button>
      </nav>
      <div className="hero">
        <div className="hero-copy">
          <div className="eyebrow"><span>●</span> Enfin, on se décide</div>
          <h1>La sortie qui<br />sort du <em>groupe.</em></h1>
          <p>Propose des dates, partage un lien et laisse chacun voter. Sans compte et sans conversation interminable.</p>
          <button className="primary large" onClick={onCreate}>Créer une sortie <span>→</span></button>
          <small>Gratuit · Aucun compte requis</small>
        </div>
        <div className="hero-demo" aria-label="Exemple d’une sortie BIMA">
          <div className="scribble">moins de blabla,<br />plus de sorties ↘</div>
          <div className="phone-card">
            <div className="phone-head">
              <div><span className="mini-label">PROCHAINE SORTIE</span><h3>La sortie de votre groupe</h3><p>Dates, étapes et réponses au même endroit.</p></div>
              <span className="status-dot">4 réponses</span>
            </div>
            <div className="date-stack">
              {["Vendredi soir", "Samedi midi", "Dimanche après-midi"].map((label, index) => (
                <div className={`mini-date ${index === 1 ? "winner" : ""}`} key={label}>
                  <div className="calendar"><b>{index + 12}</b><span>JUIN</span></div>
                  <div><strong>{label}</strong><small>{index === 1 ? "Tout le monde est disponible" : "Réponses en cours"}</small></div>
                  <b className="score">{index === 1 ? "5/5" : `${index + 2}/5`}</b>
                </div>
              ))}
            </div>
            <div className="confirm-strip"><span>La meilleure date ressort automatiquement</span><b>Confirmer →</b></div>
          </div>
        </div>
      </div>
      <div className="steps">
        <span>1</span><p><b>Tu proposes</b><br />jusqu’à 4 dates</p>
        <i>→</i><span>2</span><p><b>Ils répondent</b><br />depuis le lien partagé</p>
        <i>→</i><span>3</span><p><b>Tu confirmes</b><br />et télécharges le calendrier</p>
      </div>
      <footer className="public-footer">BIMA · Les prénoms et réponses sont utilisés uniquement pour organiser la sortie. <a href="/confidentialite">Confidentialité</a></footer>
    </section>
  );
}

function CreatePage({
  onCreated,
  onError,
  globalError,
}: {
  onCreated: (payload: CreatedEventResponse) => void;
  onError: (message: string) => void;
  globalError: string;
}) {
  const [eventType, setEventType] = useState<BimaEvent["eventType"]>("outing");
  const [title, setTitle] = useState("");
  const [organizerName, setOrganizerName] = useState("");
  const [organizerEmail, setOrganizerEmail] = useState("");
  const [maxPlaces, setMaxPlaces] = useState("8");
  const [budget, setBudget] = useState("30");
  const [deadline, setDeadline] = useState("");
  const [website, setWebsite] = useState("");
  const [places, setPlaces] = useState<PlaceDraft[]>([initialPlace()]);
  const [dates, setDates] = useState<DateDraft[]>([{ id: "date-1", date: "", time: "19:30", endDate: "" }]);
  const [busy, setBusy] = useState(false);

  const resolvePlace = async (index: number) => {
    const draft = places[index];
    if (!draft.mapsUrl.trim()) throw new Error(`Ajoute un lien Google Maps classique pour l’étape ${index + 1}.`);
    setPlaces((current) => current.map((place, placeIndex) => placeIndex === index ? { ...place, loading: true, error: "" } : place));
    try {
      const response = await fetch("/api/places", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ url: draft.mapsUrl }),
      });
      const resolved = await readPayload<{ place: PlaceData; resolvedUrl: string }>(response);
      setPlaces((current) => current.map((place, placeIndex) => placeIndex === index
        ? { ...place, mapsUrl: resolved.resolvedUrl || place.mapsUrl, data: { ...resolved.place, name: place.name.trim() || resolved.place.name, address: place.city.trim() || resolved.place.address }, loading: false, error: "" }
        : place));
      return { ...resolved.place, name: draft.name.trim() || resolved.place.name, address: draft.city.trim() || resolved.place.address, mapsUrl: resolved.resolvedUrl || draft.mapsUrl };
    } catch (placeError) {
      const message = placeError instanceof Error ? placeError.message : "Lien Google Maps non reconnu.";
      setPlaces((current) => current.map((place, placeIndex) => placeIndex === index ? { ...place, loading: false, error: message } : place));
      throw new Error(message);
    }
  };

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onError("");
    setBusy(true);
    try {
      if (!title.trim() || !organizerName.trim() || !organizerEmail.trim()) throw new Error("Renseigne le titre, ton prénom et ton e-mail.");
      if (places.some((place) => !place.name.trim() || !place.city.trim())) throw new Error("Renseigne le nom du lieu et la ville pour chaque étape.");
      const normalizedDates = dates.map((date) => {
        if (eventType === "stay") {
          if (!date.date || !date.endDate) throw new Error("Complète les dates de départ et de retour de chaque séjour.");
          const startsAt = new Date(`${date.date}T00:00:00.000Z`);
          const endsAt = new Date(`${date.endDate}T00:00:00.000Z`);
          const duration = endsAt.getTime() - startsAt.getTime();
          if (Number.isNaN(startsAt.getTime()) || startsAt.getTime() <= Date.now()) throw new Error("Tous les départs doivent être dans le futur.");
          if (Number.isNaN(endsAt.getTime()) || duration < 0) throw new Error("La date de retour doit être après la date de départ.");
          if (duration > 30 * 24 * 60 * 60 * 1000) throw new Error("Un séjour ne peut pas dépasser 30 jours pour le moment.");
          return { startsAt: startsAt.toISOString(), endsAt: endsAt.toISOString() };
        }
        if (!date.date || !date.time) throw new Error("Complète chaque date et chaque heure.");
        const value = new Date(`${date.date}T${date.time}:00`);
        if (Number.isNaN(value.getTime()) || value.getTime() <= Date.now() + 5 * 60 * 1000) throw new Error("Toutes les propositions doivent être dans le futur.");
        return { startsAt: value.toISOString(), endsAt: null };
      });
      if (deadline && new Date(`${deadline}T23:59:59`).getTime() >= Math.min(...normalizedDates.map((date) => Date.parse(date.startsAt)))) {
        throw new Error("La date limite de réponse doit précéder la première proposition.");
      }
      const resolvedPlaces = await Promise.all(places.map(async (place, index) => {
        if (!place.mapsUrl.trim()) return { name: place.name.trim(), address: place.city.trim(), mapsUrl: "", rating: "", ratingLabel: "", category: "", hours: "", image: "" };
        if (place.data) return { ...place.data, name: place.name.trim(), address: place.city.trim(), mapsUrl: place.mapsUrl };
        return resolvePlace(index);
      }));
      const response = await fetch("/api/events", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          title: title.trim(),
          eventType,
          city: places[0].city.trim(),
          organizerName: organizerName.trim(),
          organizerEmail: organizerEmail.trim().toLowerCase(),
          maxPlaces: Number(maxPlaces),
          budgetEur: budget ? Number(budget) : null,
          responseDeadline: deadline || null,
          website,
          places: resolvedPlaces,
          dates: normalizedDates,
        }),
      });
      onCreated(await readPayload<CreatedEventResponse>(response));
    } catch (createError) {
      onError(createError instanceof Error ? createError.message : "Impossible de créer cette sortie.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="form-page">
      <div className="progress"><i style={{ width: "100%" }} /></div>
      <div className="form-intro">
        <span className="step-label">NOUVELLE SORTIE</span>
        <h2>On organise quoi ?</h2>
        <p>Les informations saisies ici seront visibles par les personnes qui recevront le lien.</p>
      </div>
      <form onSubmit={submit}>
        <div className="form-grid">
          <label className="field full"><span>Nom de la sortie</span><input value={title} onChange={(event) => setTitle(event.target.value)} maxLength={120} placeholder="Ex. Anniversaire de Léa" required /></label>
          <fieldset className="event-type-picker full">
            <legend>Quel format organises-tu ?</legend>
            <button type="button" className={eventType === "outing" ? "selected" : ""} onClick={() => setEventType("outing")} aria-pressed={eventType === "outing"}><b>Une sortie</b><span>Une date et une heure</span></button>
            <button type="button" className={eventType === "stay" ? "selected" : ""} onClick={() => setEventType("stay")} aria-pressed={eventType === "stay"}><b>Un séjour</b><span>Du départ au retour</span></button>
          </fieldset>
          <label className="field"><span>Ton prénom</span><input value={organizerName} onChange={(event) => setOrganizerName(event.target.value)} maxLength={60} placeholder="Ex. Camille" required /></label>
          <label className="field"><span>Ton e-mail</span><input type="email" value={organizerEmail} onChange={(event) => setOrganizerEmail(event.target.value)} maxLength={254} autoComplete="email" placeholder="toi@exemple.fr" required /><small className="field-help">On y envoie ton lien privé de gestion. Pense à vérifier tes spams.</small></label>
          <label className="field"><span>Nombre de places</span><input type="number" min="2" max="200" step="1" value={maxPlaces} onChange={(event) => setMaxPlaces(event.target.value)} required /></label>
          <label className="field"><span>Budget par personne <i>optionnel</i></span><div className="input-suffix"><input type="number" min="10" step="10" value={budget} onChange={(event) => setBudget(event.target.value)} /><b>€</b></div></label>
          <div className="itinerary-heading"><span className="step-label">ITINÉRAIRE · 1 OU 2 LIEUX</span><h3>Comment va se dérouler la sortie ?</h3><p>Indique le lieu et sa ville. Tu peux ajouter un lien Google Maps classique si tu l’as.</p></div>
          {places.map((place, index) => (
            <div className="place-editor full" key={index}>
              <label className="field itinerary-field">
                <span><b>{index + 1}</b> Étape {index + 1} <i>{index === 0 ? "obligatoire" : "optionnelle"}</i></span>
                <div className="stage-input-row">
                  <input value={place.name} onChange={(event) => setPlaces((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, name: event.target.value, data: null, error: "" } : item))} maxLength={160} placeholder="Nom du lieu" aria-label={`Nom du lieu de l’étape ${index + 1}`} required />
                  <input value={place.city} onChange={(event) => setPlaces((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, city: event.target.value, data: null, error: "" } : item))} maxLength={100} placeholder="Ville" aria-label={`Ville de l’étape ${index + 1}`} required />
                  <div className="maps-input"><input value={place.mapsUrl} onChange={(event) => setPlaces((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, mapsUrl: event.target.value, data: null, error: "" } : item))} placeholder="Lien Google Maps (optionnel)" aria-describedby={`maps-help-${index}`} /><button type="button" onClick={() => void resolvePlace(index)} disabled={place.loading || !place.mapsUrl.trim()}>{place.loading ? "Recherche…" : "Prévisualiser"}</button></div>
                  <small className="field-help maps-help" id={`maps-help-${index}`}>Lien facultatif · seuls les liens Google Maps classiques sont acceptés.</small>
                </div>
              </label>
              {place.error && <p className="inline-error">{place.error}</p>}
              {place.data && <div className="place-preview-wrap route-preview"><span className="preview-caption">ÉTAPE {index + 1}</span><PlacePreview mapsUrl={place.mapsUrl} placeData={place.data} /></div>}
            </div>
          ))}
          {places.length < 2 ? <button className="add-date full" type="button" onClick={() => setPlaces((current) => [...current, initialPlace()])}>＋ Ajouter une deuxième étape</button> : <button className="text-link full" type="button" onClick={() => setPlaces((current) => current.slice(0, 1))}>Retirer la deuxième étape</button>}
        </div>
        <div className="date-builder">
          <div className="section-heading"><div><span className="step-label">{eventType === "stay" ? "PÉRIODES" : "DATES"}</span><h3>{eventType === "stay" ? "Quand pourriez-vous partir ?" : "Quand pourrait-elle avoir lieu ?"}</h3></div><small>1 à 4 propositions</small></div>
          {dates.map((date, index) => (
            <div className={`date-input ${eventType === "stay" ? "stay-range" : ""}`} key={date.id}>
              <span>{index + 1}</span>
              <label><small>{eventType === "stay" ? "Départ" : "Date"}</small><input type="date" value={date.date} onChange={(event) => setDates((current) => current.map((item) => item.id === date.id ? { ...item, date: event.target.value } : item))} required /></label>
              {eventType === "stay"
                ? <label><small>Retour</small><input type="date" min={date.date || undefined} value={date.endDate} onChange={(event) => setDates((current) => current.map((item) => item.id === date.id ? { ...item, endDate: event.target.value } : item))} required /></label>
                : <label><small>Heure</small><input type="time" value={date.time} onChange={(event) => setDates((current) => current.map((item) => item.id === date.id ? { ...item, time: event.target.value } : item))} required /></label>}
              {dates.length > 1 && <button type="button" onClick={() => setDates((current) => current.filter((item) => item.id !== date.id))} aria-label="Supprimer cette date">×</button>}
            </div>
          ))}
          {dates.length < 4 && <button className="add-date" type="button" onClick={() => setDates((current) => [...current, { id: `date-${Date.now()}`, date: "", time: "19:30", endDate: "" }])}>＋ Ajouter {eventType === "stay" ? "une période" : "une date"}</button>}
        </div>
        <div className="create-footer">
          <label className="field"><span>Réponses souhaitées avant le <i>optionnel</i></span><input type="date" value={deadline} onChange={(event) => setDeadline(event.target.value)} /></label>
          <p><b>Ton lien privé arrive aussi par e-mail.</b>Tu pourras suivre les réponses, retirer un invité et confirmer {eventType === "stay" ? "la période" : "la date"}. Pense à vérifier tes spams.</p>
          <label className="honeypot" aria-hidden="true">Site web<input tabIndex={-1} autoComplete="off" value={website} onChange={(event) => setWebsite(event.target.value)} /></label>
          {globalError && <div className="form-error" role="alert">{globalError}</div>}
          <button className="primary" type="submit" disabled={busy}>{busy ? "Création en cours…" : `Créer ${eventType === "stay" ? "le séjour" : "la sortie"} et obtenir les liens`} <span>→</span></button>
        </div>
      </form>
    </section>
  );
}

function SharePage({ payload, copied, onCopy, onManage }: { payload: CreatedEventResponse; copied: boolean; onCopy: (text: string, message?: string) => Promise<void>; onManage: () => void }) {
  const shareUrl = absoluteUrl(payload.sharePath);
  const timingWord = payload.event.eventType === "stay" ? "périodes" : "dates";
  const message = `🎉 ${payload.event.title}, ça se prépare !\n\n1️⃣ Clique\n2️⃣ Coche tes ${timingWord} + tes étapes\n3️⃣ Et hop, on trouve le bon moment 😎\n\n⏱️ 20 sec, sans compte :\n${shareUrl}`;
  const shareInvitation = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: payload.event.title, text: message, url: shareUrl });
        return;
      } catch (shareError) {
        if (shareError instanceof DOMException && shareError.name === "AbortError") return;
      }
    }
    await onCopy(message, "Invitation copiée · tu peux maintenant la partager");
  };

  return (
    <section className="center-page">
      <div className="success-mark">✓</div>
      <span className="step-label">C’EST PARTI !</span>
      <h2>{payload.event.eventType === "stay" ? "Ton séjour est créé" : "Ta sortie est créée"} 🎉</h2>
      <p className="lead">Prochaine étape : envoie l’invitation au groupe pour récupérer leurs disponibilités.</p>

      <section className="invitation-card" aria-labelledby="invitation-title">
        <span className="step-label" id="invitation-title">LIEN À ENVOYER AU GROUPE</span>
        <h3>À eux de jouer !</h3>
        <p>Tes proches pourront choisir leurs {timingWord} et leurs étapes. Ils n’auront pas accès à la gestion.</p>
        <div className="share-actions">
          <button className="share-primary" type="button" onClick={() => void shareInvitation()}>Partager l’invitation</button>
          <button className="secondary" type="button" onClick={() => void onCopy(shareUrl, "Lien d’invitation copié")}>{copied ? "Lien copié !" : "Copier le lien d’invitation"}</button>
        </div>
        <a className="text-link share-link" href={shareUrl} target="_blank" rel="noreferrer">Voir la page des invités →</a>
      </section>

      <section className={`organizer-access ${payload.emailSent ? "sent" : "failed"}`} aria-labelledby="organizer-access-title">
        <span className="organizer-access-icon" aria-hidden="true">🔒</span>
        <div>
          <span className="step-label" id="organizer-access-title">TON ESPACE ORGANISATEUR</span>
          <h3>{payload.emailSent ? "Ton accès privé est dans ta boîte mail" : "Garde cette page ouverte"}</h3>
          <p>{payload.emailSent ? <>Il vient d’être envoyé à <b>{payload.organizerEmail}</b>. Garde-le pour toi : il permet de consulter les réponses et de confirmer la sortie.</> : <><b>L’e-mail n’est pas parti.</b> {payload.emailWarning || "Accède maintenant à ta gestion pour ne pas perdre ton accès."}</>}</p>
          <button className="organizer-access-button" type="button" onClick={onManage}>Accéder à ma page de gestion →</button>
          {payload.emailSent && <small>Rien reçu ? Vérifie tes spams ou courriers indésirables.</small>}
        </div>
      </section>
    </section>
  );
}

function RespondPage({ payload, name, setName, availableDateIds, setAvailableDateIds, availablePlaceIds, setAvailablePlaceIds, busy, error, onSubmit }: {
  payload: EventResponse;
  name: string;
  setName: (value: string) => void;
  availableDateIds: string[];
  setAvailableDateIds: (value: string[]) => void;
  availablePlaceIds: string[];
  setAvailablePlaceIds: (value: string[]) => void;
  busy: boolean;
  error: string;
  onSubmit: () => Promise<void>;
}) {
  const event = payload.event;
  return (
    <section className="respond-page">
      <div className="event-banner">
        <div><span className="step-label inverse">{event.organizerName.toUpperCase()} T’INVITE</span><h2>{event.title}</h2><p>{event.city} · {event.budgetEur ? `Environ ${event.budgetEur} € · ` : ""}{event.maxPlaces} places</p></div>
        {event.responseDeadline && <div className="deadline"><small>Répondre avant</small><b>{formatDate(`${event.responseDeadline}T12:00:00`, { day: "numeric", month: "short" }).toUpperCase()}</b></div>}
      </div>
      <div className="respond-body">
        <ItineraryPreview places={event.places} />
        <div className="response-heading"><div><span className="step-label">TES DISPONIBILITÉS</span><h3>{event.eventType === "stay" ? "Sur quelle période peux-tu partir ?" : "Quand peux-tu venir ?"}</h3></div><span className="fast-badge">≈ 20 sec</span></div>
        <label className="field name-field"><span>Ton prénom</span><input value={name} onChange={(input) => setName(input.target.value)} maxLength={60} placeholder="Ton prénom" /></label>
        <div className="availability-list">
          {event.dates.map((date) => {
            const selected = availableDateIds.includes(date.id);
            const parts = event.eventType === "stay" ? stayDateParts(date.startsAt) : dateParts(date.startsAt);
            return <button type="button" className={`availability ${selected ? "yes" : ""}`} key={date.id} onClick={() => setAvailableDateIds(selected ? availableDateIds.filter((id) => id !== date.id) : [...availableDateIds, date.id])} aria-pressed={selected}><div className="calendar"><b>{parts.number}</b><span>{parts.month}</span></div><div><strong>{formatEventDate(date, event.eventType)}</strong><small>{date.availableCount} personne{date.availableCount > 1 ? "s" : ""} disponible{date.availableCount > 1 ? "s" : ""}</small></div><div className="choice"><span>{selected ? "Disponible" : "Pas dispo"}</span><i>{selected ? "✓" : "×"}</i></div></button>;
          })}
        </div>
        <section className="stage-vote-card" aria-labelledby="stage-vote-title">
          <div className="stage-vote-heading"><div><span className="step-label">TON PROGRAMME</span><h3 id="stage-vote-title">À quelles étapes seras-tu là ?</h3><p>Choisis toutes les étapes auxquelles tu participeras.</p></div><b>{availablePlaceIds.length === event.places.length ? "Toute la sortie" : availablePlaceIds.length ? `${availablePlaceIds.length} étape${availablePlaceIds.length > 1 ? "s" : ""}` : "Aucune étape"}</b></div>
          <div className="stage-choice-list">{event.places.map((place, index) => { const selected = availablePlaceIds.includes(place.id); return <button type="button" className={selected ? "selected" : ""} key={place.id} onClick={() => setAvailablePlaceIds(selected ? availablePlaceIds.filter((id) => id !== place.id) : [...availablePlaceIds, place.id])} aria-pressed={selected}><span><i>{index + 1}</i><small>Étape {index + 1}</small><strong>{place.name}</strong></span><b>{selected ? "✓ Je serai là" : "× Je ne serai pas là"}</b></button>; })}</div>
          <p className="stage-vote-help">Tu peux sélectionner toutes les étapes, une seule, ou aucune.</p>
        </section>
        {error && <div className="form-error" role="alert">{error}</div>}
        <button className="primary full-button" onClick={() => void onSubmit()} disabled={busy}>{busy ? "Enregistrement…" : payload.me ? "Mettre à jour mes réponses" : "Valider mes réponses"} <span>→</span></button>
        <p className="privacy">Aucun compte, aucun email. Ton lien personnel permet de modifier ta réponse.</p>
      </div>
    </section>
  );
}

function SavedPage({ payload, participantToken, participantShortCode, copied, onCopy }: { payload: EventResponse; participantToken: string; participantShortCode: string; copied: boolean; onCopy: (text: string, message?: string) => Promise<void> }) {
  const personalUrl = absoluteUrl(participantShortCode ? `/p/${encodeURIComponent(participantShortCode)}` : `/?event=${encodeURIComponent(payload.event.slug)}&participant=${encodeURIComponent(participantToken)}`);
  return <section className="center-page compact"><div className="success-mark pop">✓</div><h2>C’est noté{payload.me?.name ? `, ${payload.me.name}` : ""} !</h2><p className="lead">{payload.event.organizerName} voit maintenant tes {payload.event.eventType === "stay" ? "périodes" : "dates"} et les étapes choisies.</p><div className="token-card"><span>TON LIEN PERSONNEL</span><p>{personalUrl}</p><button onClick={() => void onCopy(personalUrl, "Lien personnel copié")}>{copied ? "Copié" : "Copier"}</button></div><div className="notice warning"><span>★</span><p><b>Conserve ce lien.</b><br />Il permet de modifier tes réponses plus tard, même depuis un autre appareil.</p></div><a className="text-link share-link" href={personalUrl}>Modifier mes réponses →</a></section>;
}

function EditEventPanel({ event, participantCount, busy, onCancel, onSave }: {
  event: BimaEvent;
  participantCount: number;
  busy: boolean;
  onCancel: () => void;
  onSave: (input: EventUpdateInput) => Promise<void>;
}) {
  const [title, setTitle] = useState(event.title);
  const [maxPlaces, setMaxPlaces] = useState(String(event.maxPlaces));
  const [budget, setBudget] = useState(event.budgetEur == null ? "" : String(event.budgetEur));
  const [deadline, setDeadline] = useState(event.responseDeadline || "");
  const [places, setPlaces] = useState(() => event.places.map((place) => ({
    id: place.id,
    name: place.name,
    address: place.address,
    mapsUrl: place.mapsUrl,
  })));

  const submit = async (submitEvent: FormEvent<HTMLFormElement>) => {
    submitEvent.preventDefault();
    await onSave({
      title: title.trim(),
      maxPlaces: Number(maxPlaces),
      budgetEur: budget ? Number(budget) : null,
      responseDeadline: deadline || null,
      places: places.map((place) => ({ ...place, name: place.name.trim(), address: place.address.trim(), mapsUrl: place.mapsUrl.trim() })),
    });
  };

  return (
    <form className="event-edit-panel" onSubmit={(submitEvent) => void submit(submitEvent)}>
      <div className="event-edit-heading"><div><span className="step-label">MODIFIER LA SORTIE</span><h3>Une info a changé ?</h3><p>Les dates proposées, les participants et leurs votes restent inchangés.</p></div><button type="button" className="icon-button" onClick={onCancel} aria-label="Fermer le formulaire">×</button></div>
      <div className="event-edit-grid">
        <label className="field full"><span>Nom de la sortie</span><input value={title} onChange={(input) => setTitle(input.target.value)} maxLength={120} required /></label>
        <label className="field"><span>Nombre de places</span><input type="number" min={Math.max(2, participantCount)} max="200" value={maxPlaces} onChange={(input) => setMaxPlaces(input.target.value)} required /><small>Minimum actuel : {participantCount}</small></label>
        <label className="field"><span>Budget par personne</span><input type="number" min="10" step="10" value={budget} onChange={(input) => setBudget(input.target.value)} placeholder="Facultatif" /></label>
        <label className="field full"><span>Date limite de réponse</span><input type="date" value={deadline} onChange={(input) => setDeadline(input.target.value)} /></label>
      </div>
      <div className="edit-places"><span className="step-label">LIEU{places.length > 1 ? "X" : ""}</span>{places.map((place, index) => <fieldset key={place.id}><legend>Étape {index + 1}</legend><label className="field"><span>Nom du lieu</span><input value={place.name} onChange={(input) => setPlaces((current) => current.map((item) => item.id === place.id ? { ...item, name: input.target.value } : item))} maxLength={160} required /></label><label className="field"><span>Ville</span><input value={place.address} onChange={(input) => setPlaces((current) => current.map((item) => item.id === place.id ? { ...item, address: input.target.value } : item))} maxLength={100} required /></label><label className="field full"><span>Lien Google Maps (optionnel)</span><input type="url" value={place.mapsUrl} onChange={(input) => setPlaces((current) => current.map((item) => item.id === place.id ? { ...item, mapsUrl: input.target.value } : item))} placeholder="https://www.google.com/maps/..." /></label></fieldset>)}</div>
      <div className="event-edit-actions"><button type="button" className="secondary" onClick={onCancel} disabled={busy}>Annuler</button><button type="submit" className="primary" disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer les modifications"}</button></div>
    </form>
  );
}

function NotificationPreferencesPanel({ preferences, busy, onSave }: {
  preferences: NotificationPreferences;
  busy: boolean;
  onSave: (preferences: Pick<NotificationPreferences, "newResponses" | "reminders">) => Promise<void>;
}) {
  const [newResponses, setNewResponses] = useState(preferences.newResponses);
  const [reminders, setReminders] = useState(preferences.reminders);
  return (
    <section className="notification-preferences" aria-labelledby="notification-preferences-title">
      <div><span className="step-label">E-MAILS DE SUIVI</span><h3 id="notification-preferences-title">BIMA te tient au courant</h3><p>{preferences.active ? "Choisis les nouvelles que tu veux recevoir pour cette sortie." : "Cette sortie existait avant les e-mails de suivi. Active-les quand tu veux."}</p></div>
      <div className="notification-options">
        <label><input type="checkbox" checked={newResponses} onChange={(input) => setNewResponses(input.target.checked)} /><span><b>Nouvelles réponses</b><small>Un e-mail lorsqu’un invité répond pour la première fois.</small></span></label>
        <label><input type="checkbox" checked={reminders} onChange={(input) => setReminders(input.target.checked)} /><span><b>Moments importants</b><small>Sortie complète, rappel 48 h avant et décision à la date limite.</small></span></label>
      </div>
      <button type="button" className="secondary" disabled={busy} onClick={() => void onSave({ newResponses, reminders })}>{busy ? "Enregistrement…" : preferences.active ? "Enregistrer mes choix" : "Activer ces e-mails"}</button>
    </section>
  );
}

function ManagePage({ payload, name, availableDateIds, setAvailableDateIds, availablePlaceIds, setAvailablePlaceIds, busy, error, copied, onSaveVote, onUpdate, onUpdateNotifications, onConfirm, onCopy, onDeleteParticipant, onDelete }: {
  payload: EventResponse;
  name: string;
  availableDateIds: string[];
  setAvailableDateIds: (value: string[]) => void;
  availablePlaceIds: string[];
  setAvailablePlaceIds: (value: string[]) => void;
  busy: boolean;
  error: string;
  copied: boolean;
  onSaveVote: () => Promise<void>;
  onUpdate: (input: EventUpdateInput) => Promise<void>;
  onUpdateNotifications: (preferences: Pick<NotificationPreferences, "newResponses" | "reminders">) => Promise<void>;
  onConfirm: (dateId: string) => Promise<void>;
  onCopy: (text: string, message?: string) => Promise<void>;
  onDeleteParticipant: (participant: Participant) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [editing, setEditing] = useState(false);
  const event = payload.event;
  const voters = payload.voters || [];
  const bestCount = Math.max(0, ...event.dates.map((date) => date.availableCount));
  const shareUrl = absoluteUrl(eventSharePath(event.slug));
  const selectedDate = event.dates.find((date) => date.id === event.confirmedDateId);
  const rowStyle = { gridTemplateColumns: `1.6fr repeat(${event.dates.length}, minmax(120px, 1fr))` };
  const stageRowStyle = { gridTemplateColumns: `1.6fr repeat(${event.places.length}, minmax(150px, 1fr))` };
  return (
    <section className="manage-page">
      <div className="management-head"><div><span className="step-label">PAGE PRIVÉE · ORGANISATEUR</span><h2>{event.title}</h2><p>{event.city} · {event.maxPlaces} places{event.responseDeadline ? ` · Réponses jusqu’au ${formatDate(`${event.responseDeadline}T12:00:00`, { day: "numeric", month: "long" })}` : ""}</p></div><div className="status-panel"><span>{event.status === "confirmed" ? `✓ ${event.eventType === "stay" ? "Période" : "Date"} confirmée` : "● Réponses en cours"}</span><b>{payload.summary.participantCount}<small>/{event.maxPlaces} places</small></b></div></div>
      <div className="manage-toolbar"><div><b>{payload.summary.guestCount} invité{payload.summary.guestCount > 1 ? "s ont" : " a"} répondu · ton vote est inclus</b><span>Les résultats sont lus directement depuis BIMA.</span></div><button className="secondary" onClick={() => setEditing((value) => !value)}>{editing ? "Fermer" : "Modifier les informations"}</button><button className="secondary" onClick={() => void onCopy(shareUrl, "Lien invité copié")}>{copied ? "Copié" : "Copier le lien"}</button><a className="dark-button share-link" href={`https://wa.me/?text=${encodeURIComponent(`🎉 ${event.title} : 20 sec pour cocher tes dispos et tes étapes 👉 ${shareUrl}`)}`} target="_blank" rel="noreferrer">↗ Relancer</a></div>
      {editing && <EditEventPanel event={event} participantCount={payload.summary.participantCount} busy={busy} onCancel={() => setEditing(false)} onSave={async (input) => { await onUpdate(input); setEditing(false); }} />}
      <NotificationPreferencesPanel preferences={payload.notificationPreferences || { newResponses: true, reminders: true, active: false }} busy={busy} onSave={onUpdateNotifications} />
      <section className="participant-manager" aria-labelledby="participant-manager-title"><div><span className="step-label">LISTE DES PARTICIPANTS</span><h3 id="participant-manager-title">Qui est dans la boucle ?</h3><p>Une erreur ou un doublon ? Tu peux retirer un invité ici.</p></div><div className="participant-list">{voters.map((voter) => <div key={voter.id}><span className={voter.role === "organizer" ? "organizer-color" : "blue"}>{voter.name.slice(0, 2).toUpperCase()}</span><p><b>{voter.name}</b><small>{voter.role === "organizer" ? "Organisateur · toi" : "Invité"}</small></p>{voter.role === "guest" ? <button type="button" onClick={() => void onDeleteParticipant(voter)} disabled={busy} aria-label={`Retirer ${voter.name}`}>Retirer</button> : <em>Protégé</em>}</div>)}</div></section>
      {selectedDate && <div className="manage-confirmed"><div><span>{event.eventType === "stay" ? "PÉRIODE CONFIRMÉE" : "DATE CONFIRMÉE"}</span><b>{formatEventDate(selectedDate, event.eventType)}</b></div><a className="primary share-link" href={`/api/events/${encodeURIComponent(event.slug)}/calendar`}>Télécharger le calendrier .ics</a></div>}
      <div className="organizer-vote"><div className="organizer-vote-heading"><span className="organizer-avatar">{name.slice(0, 2).toUpperCase() || "OR"}</span><div><b>Mes disponibilités</b><small>Ton vote compte comme celui de chaque invité.</small></div><em>ORGANISATEUR</em></div><div className="organizer-options" style={{ gridTemplateColumns: `repeat(${Math.min(event.dates.length, 4)}, 1fr)` }}>{event.dates.map((date) => { const selected = availableDateIds.includes(date.id); return <button type="button" className={selected ? "selected" : ""} key={date.id} onClick={() => setAvailableDateIds(selected ? availableDateIds.filter((id) => id !== date.id) : [...availableDateIds, date.id])} aria-pressed={selected}><span>{formatEventDate(date, event.eventType, true).toUpperCase()}</span><b>{selected ? "✓ Disponible" : "× Pas disponible"}</b></button>; })}</div></div>
      <div className="organizer-vote organizer-stage-vote"><div className="organizer-vote-heading"><span className="organizer-avatar">{name.slice(0, 2).toUpperCase() || "OR"}</span><div><b>Mes étapes</b><small>Indique les parties de la sortie auxquelles tu participeras.</small></div><em>ORGANISATEUR</em></div><div className="organizer-options stage-organizer-options">{event.places.map((place, index) => { const selected = availablePlaceIds.includes(place.id); return <button type="button" className={selected ? "selected" : ""} key={place.id} onClick={() => setAvailablePlaceIds(selected ? availablePlaceIds.filter((id) => id !== place.id) : [...availablePlaceIds, place.id])} aria-pressed={selected}><span>ÉTAPE {index + 1}</span><b>{selected ? `✓ ${place.name}` : "× Absent·e"}</b></button>; })}</div></div>
      {error && <div className="form-error" role="alert">{error}</div>}
      {event.status !== "confirmed" && <button className="primary organizer-save" onClick={() => void onSaveVote()} disabled={busy}>{busy ? "Enregistrement…" : "Enregistrer mon vote"}</button>}
      <div className="matrix-card"><div className="matrix-title"><h3>{event.status === "confirmed" ? "Résultats des disponibilités" : `Choisis la meilleure ${event.eventType === "stay" ? "période" : "date"}`}</h3><span>Les scores se mettent à jour après chaque réponse</span></div><div className="matrix-scroll"><div className="matrix dynamic-matrix"><div className="matrix-row matrix-header" style={rowStyle}><div>PARTICIPANTS</div>{event.dates.map((date) => <div className={date.availableCount === bestCount ? "best" : ""} key={date.id}><span>{event.eventType === "stay" ? "SÉJOUR" : dateParts(date.startsAt).day}</span><b>{formatEventDate(date, event.eventType, true).toUpperCase()}</b><small>{event.eventType === "stay" ? "Départ → retour" : dateParts(date.startsAt).time}</small>{date.availableCount === bestCount && <em>MEILLEURE</em>}</div>)}</div>{voters.map((voter) => <div className={`matrix-row ${voter.role === "organizer" ? "organizer-row" : ""}`} style={rowStyle} key={voter.id}><div className="person"><i className={voter.role === "organizer" ? "organizer-color" : "blue"}>{voter.name.slice(0, 2).toUpperCase()}</i><b>{voter.name}{voter.role === "organizer" && <span>Vous</span>}</b></div>{event.dates.map((date) => <div className={date.availableCount === bestCount ? "best" : ""} key={date.id}><span className={voter.answers[date.id] ? "check" : "cross"}>{voter.answers[date.id] ? "✓" : "×"}</span></div>)}</div>)}<div className="matrix-row totals" style={rowStyle}><div>DISPONIBLES</div>{event.dates.map((date) => <div className={date.availableCount === bestCount ? "best" : ""} key={date.id}><b>{date.availableCount}/{payload.summary.participantCount}</b></div>)}</div>{event.status !== "confirmed" && <div className="matrix-row actions" style={rowStyle}><div /><>{event.dates.map((date) => <div className={date.availableCount === bestCount ? "best" : ""} key={date.id}><button className={date.availableCount === bestCount ? "primary" : "secondary"} onClick={() => void onConfirm(date.id)} disabled={busy}>Confirmer</button></div>)}</></div>}</div></div></div>
      <div className="matrix-card stage-matrix-card"><div className="matrix-title"><h3>Présence à chaque étape</h3><span>Une personne peut rejoindre seulement une partie de la sortie</span></div><div className="matrix-scroll"><div className="matrix stage-matrix"><div className="matrix-row matrix-header" style={stageRowStyle}><div>PARTICIPANTS</div>{event.places.map((place, index) => <div key={place.id}><span>ÉTAPE {index + 1}</span><b>{place.name}</b></div>)}</div>{voters.map((voter) => <div className={`matrix-row ${voter.role === "organizer" ? "organizer-row" : ""}`} style={stageRowStyle} key={voter.id}><div className="person"><i className={voter.role === "organizer" ? "organizer-color" : "coral"}>{voter.name.slice(0, 2).toUpperCase()}</i><b>{voter.name}</b></div>{event.places.map((place) => <div key={place.id}><span className={voter.stageAnswers[place.id] ? "check" : "cross"}>{voter.stageAnswers[place.id] ? "✓" : "×"}</span></div>)}</div>)}<div className="matrix-row totals" style={stageRowStyle}><div>PRÉSENTS</div>{event.places.map((place) => <div key={place.id}><b>{place.attendingCount}/{payload.summary.participantCount}</b></div>)}</div></div></div></div>
      <ItineraryPreview places={event.places} />
      <div className="danger-zone"><div><b>Supprimer cette sortie</b><span>Efface définitivement les lieux, dates, participants et réponses.</span></div><button type="button" onClick={() => void onDelete()} disabled={busy}>Supprimer définitivement</button></div>
    </section>
  );
}

function ConfirmedPage({ payload, copied, onCopy }: { payload: EventResponse; copied: boolean; onCopy: (text: string, message?: string) => Promise<void> }) {
  const event = payload.event;
  const selectedDate = event.dates.find((date) => date.id === event.confirmedDateId);
  if (!selectedDate) return <ErrorPage message="La date confirmée n’est plus disponible." onHome={() => { window.location.href = "/"; }} />;
  const isStay = event.eventType === "stay" && Boolean(selectedDate.endsAt);
  const parts = isStay ? stayDateParts(selectedDate.startsAt) : dateParts(selectedDate.startsAt);
  const shareUrl = absoluteUrl(eventSharePath(event.slug));
  const programme = event.places.map((place, index) => `${index + 1}. ${place.name}`).join("\n");
  const timingLabel = formatEventDate(selectedDate, event.eventType);
  const message = `C’est confirmé ! 🎉\n${timingLabel}\n${programme}\n\nTous les détails : ${shareUrl}`;
  return <section className="confirmed-page"><div className="confetti">✦　·　✦　·　✦</div><span className="step-label inverse">{isStay ? "SÉJOUR CONFIRMÉ" : "SORTIE CONFIRMÉE"}</span><h2>{isStay ? "Le séjour est calé !" : `Rendez-vous ${formatDate(selectedDate.startsAt, { weekday: "long" })} !`}</h2><p>{isStay ? "La période est fixée." : "La date est fixée."} Ajoute-la maintenant à ton calendrier.</p><div className="final-ticket"><div className="ticket-date"><span>{parts.day}</span><b>{parts.number}</b><small>{parts.month}</small></div><div className="ticket-info"><h3>{event.title}</h3><p><b>{isStay ? timingLabel : (parts as ReturnType<typeof dateParts>).time}</b> · {event.places[0]?.name || event.city}</p><span>{payload.summary.participantCount} participant{payload.summary.participantCount > 1 ? "s" : ""}{event.budgetEur ? ` · ${event.budgetEur} € / pers.` : ""}</span></div></div><div className="confirmed-itinerary"><ItineraryPreview places={event.places} /></div><div className="final-actions"><a className="white-button share-link" href={`/api/events/${encodeURIComponent(event.slug)}/calendar`}>＋ Ajouter au calendrier (.ics)</a>{event.places[0]?.mapsUrl && <a className="outline-light share-link" href={event.places[0].mapsUrl} target="_blank" rel="noreferrer">↗ Ouvrir dans Maps</a>}</div><div className="confirmation-message"><span>MESSAGE À PARTAGER</span><textarea value={message} readOnly /><div><button onClick={() => void onCopy(message, "Message copié")}>{copied ? "Copié !" : "Copier le message"}</button><a className="share-link" href={`https://wa.me/?text=${encodeURIComponent(message)}`} target="_blank" rel="noreferrer">WhatsApp</a></div></div></section>;
}

function PlacePreview({ mapsUrl, compact = false, placeData }: { mapsUrl: string; compact?: boolean; placeData: PlaceData | EventPlace }) {
  return <article className={`place-preview ${compact ? "compact-preview" : ""}`}>{placeData.image ? <Image src={placeData.image} alt="" width={320} height={220} sizes={compact ? "112px" : "155px"} unoptimized /> : <div className="place-image-fallback" aria-hidden="true">{placeData.name.slice(0, 1).toUpperCase()}</div>}<div className="place-preview-copy"><div className="google-source">{mapsUrl ? <><span>G</span> Informations Google Maps</> : <>Lieu indiqué par l’organisateur</>}</div><h4>{placeData.name}</h4>{placeData.rating && <div className="rating-line"><b>{placeData.rating}</b><span>★★★★★</span><small>{placeData.ratingLabel}</small></div>}<p>{placeData.address}</p>{(placeData.category || placeData.hours) && <div className="place-meta"><span>{placeData.category}</span><b>{placeData.hours}</b></div>}</div>{mapsUrl && <a href={mapsUrl} target="_blank" rel="noreferrer" aria-label={`Ouvrir ${placeData.name} dans Google Maps`}>↗</a>}</article>;
}

function ItineraryPreview({ places }: { places: EventPlace[] }) {
  return <section className="itinerary-preview"><div className="itinerary-preview-head"><div><span className="step-label">PROGRAMME</span><h3>{places.length > 1 ? `${places.length} étapes prévues` : "Lieu de la sortie"}</h3></div><span>{places.length} étape{places.length > 1 ? "s" : ""}</span></div>{places.map((place, index) => <div className="timeline-stop" key={place.id}><div className="timeline-marker"><b>{index + 1}</b>{index < places.length - 1 && <i />}</div><div><span className="stop-time">Étape {index + 1}</span><PlacePreview mapsUrl={place.mapsUrl} compact placeData={place} />{index < places.length - 1 && <div className="travel-time"><i>↓</i><span>Puis, étape suivante</span></div>}</div></div>)}{places.length > 1 && <a className="route-button" href={`https://www.google.com/maps/dir/?api=1&origin=${encodeURIComponent(`${places[0].name}, ${places[0].address}`)}&destination=${encodeURIComponent(`${places[places.length - 1].name}, ${places[places.length - 1].address}`)}${places.length > 2 ? `&waypoints=${encodeURIComponent(places.slice(1, -1).map((place) => `${place.name}, ${place.address}`).join("|"))}` : ""}`} target="_blank" rel="noreferrer">↗ Ouvrir l’itinéraire complet dans Google Maps</a>}</section>;
}

function LoadingPage() {
  return <main className="state-page"><Image src="/bima-logo.svg" alt="BIMA" width={72} height={72} priority /><div className="loading-spinner" /><h1>Chargement de BIMA…</h1></main>;
}

function ErrorPage({ message, onHome }: { message: string; onHome: () => void }) {
  return <section className="state-page"><Image src="/bima-logo.svg" alt="BIMA" width={72} height={72} /><div className="error-panel" role="alert"><span>Impossible d’ouvrir cette page</span><h1>{message}</h1><p>Vérifie le lien reçu ou demande à l’organisateur de le partager à nouveau.</p></div><button className="primary" onClick={onHome}>Revenir à l’accueil</button></section>;
}
