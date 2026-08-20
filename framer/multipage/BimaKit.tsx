import * as React from "react"
import { ControlType } from "framer"
import type { PropertyControls } from "framer"

export const DEFAULT_API =
    "https://ebilhzvgvinbpmmpezua.supabase.co/functions/v1/bima-api"

export const PATHS = {
    home: "/",
    create: "/creer",
    guest: "/sortie",
    manage: "/gestion",
}

export type Place = {
    id?: string
    position?: number
    startTime?: string | null
    mapsUrl: string
    name: string
    rating?: string | null
    ratingLabel?: string | null
    address?: string | null
    category?: string | null
    hours?: string | null
    image?: string | null
    attendingCount?: number
}

export type DateOption = {
    id: string
    position: number
    startsAt: string
    availableCount: number
}

export type EventData = {
    slug: string
    organizerName: string
    title: string
    city: string
    maxPlaces: number
    budgetEur: number | null
    responseDeadline: string | null
    confirmedDateId: string | null
    status: "collecting" | "confirmed"
    places: Place[]
    dates: DateOption[]
}

export type Voter = {
    id: string
    name: string
    role: "organizer" | "guest"
    answers: Record<string, boolean>
    stageAnswers: Record<string, boolean>
}

export type EventPayload = {
    event: EventData
    summary: { participantCount: number; guestCount: number }
    manage: boolean
    voters?: Voter[]
    manageToken?: string
    sharePath?: string
    managePath?: string
}

export function hasMultipleSteps(places: readonly Place[]) {
    return places.length > 1
}

export type ThemeProps = {
    apiBaseUrl?: string
    logo?: string
    logoAlt?: string
    brandText?: string
    accent?: string
    backgroundColor?: string
    surfaceColor?: string
    textColor?: string
    mutedColor?: string
    buttonColor?: string
    buttonTextColor?: string
    successColor?: string
}

export const themeDefaults: Required<Omit<ThemeProps, "logo">> = {
    apiBaseUrl: DEFAULT_API,
    logoAlt: "Logo BIMA",
    brandText: "bima",
    accent: "#E65E38",
    backgroundColor: "#F4F1E8",
    surfaceColor: "#FFFDF8",
    textColor: "#161714",
    mutedColor: "#68675F",
    buttonColor: "#161714",
    buttonTextColor: "#FFFFFF",
    successColor: "#237433",
}

export const themeControls: PropertyControls<ThemeProps> = {
    apiBaseUrl: {
        type: ControlType.String,
        title: "API BIMA",
        defaultValue: DEFAULT_API,
    },
    logo: { type: ControlType.Image, title: "Logo" },
    logoAlt: {
        type: ControlType.String,
        title: "Texte logo",
        defaultValue: themeDefaults.logoAlt,
    },
    brandText: {
        type: ControlType.String,
        title: "Nom marque",
        defaultValue: themeDefaults.brandText,
    },
    accent: {
        type: ControlType.Color,
        title: "Accent",
        defaultValue: themeDefaults.accent,
    },
    backgroundColor: {
        type: ControlType.Color,
        title: "Fond",
        defaultValue: themeDefaults.backgroundColor,
    },
    surfaceColor: {
        type: ControlType.Color,
        title: "Cartes",
        defaultValue: themeDefaults.surfaceColor,
    },
    textColor: {
        type: ControlType.Color,
        title: "Texte",
        defaultValue: themeDefaults.textColor,
    },
    mutedColor: {
        type: ControlType.Color,
        title: "Texte léger",
        defaultValue: themeDefaults.mutedColor,
    },
    buttonColor: {
        type: ControlType.Color,
        title: "Boutons",
        defaultValue: themeDefaults.buttonColor,
    },
    buttonTextColor: {
        type: ControlType.Color,
        title: "Texte bouton",
        defaultValue: themeDefaults.buttonTextColor,
    },
    successColor: {
        type: ControlType.Color,
        title: "Succès",
        defaultValue: themeDefaults.successColor,
    },
}

const joyaId = "kJWq5w12eQCtk3628"
const loulouId = "eTx2ryAgN2yK7XDBA"

export const knownPlaces: Array<{ id: string; place: Place }> = [
    {
        id: joyaId,
        place: {
            mapsUrl: `https://maps.app.goo.gl/${joyaId}`,
            name: "JOYA",
            rating: "4,7",
            ratingLabel: "Note Google",
            address: "47 Rue Saint-Charles, 75015 Paris",
            category: "Trattoria · Pizza italienne",
            hours: "Voir les horaires sur Maps",
            image: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWnwZ2ITemhSgKDYMcP8cFxXhOyriV3D2wpkWOcmkP3A7GeWL1e72gwK8RGtD9IyFsj6Gvz1jwGv7G6jlLATi2D6gdwAV3SVS2z4fcigF3K_PVtPHUOvm_69V3Om_GRDUfGldMKh=w408-h271-k-no",
        },
    },
    {
        id: loulouId,
        place: {
            mapsUrl: `https://maps.app.goo.gl/${loulouId}`,
            name: "Loulou",
            rating: "4,6",
            ratingLabel: "Note Google",
            address: "90 Bd Saint-Germain, 75005 Paris",
            category: "Restaurant australien",
            hours: "Voir les horaires sur Maps",
            image: "https://lh3.googleusercontent.com/gps-cs-s/AHRPTWlue1qC-x0WO-2b88mGYXgfOcAHZu_uEL80eAuzsdJ2MD1f-XU-JPXQGiKkRREQN1-OSpS-G_-J4vyVXeLgktYnmasy5DhYGHnmI-AUvI4uyOdY5zQHmzXTU_f0rVLOZ01lxqQbmw=w408-h271-k-no",
        },
    },
]

export function apiUrl(base: string, path: string) {
    return `${base.replace(/\/$/, "")}${path}`
}

export async function requestJson<T>(
    url: string,
    init?: RequestInit
): Promise<T> {
    const response = await fetch(url, {
        ...init,
        headers: {
            "content-type": "application/json",
            ...(init?.headers || {}),
        },
    })
    const payload = await response.json()
    if (!response.ok) {
        throw new Error(payload.error || "Une erreur est survenue.")
    }
    return payload
}

export function formatDate(value: string) {
    return new Intl.DateTimeFormat("fr-FR", {
        weekday: "short",
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
    }).format(new Date(value))
}

export function initialDate(days: number, hour: number) {
    const date = new Date()
    date.setDate(date.getDate() + days)
    date.setHours(hour, 30, 0, 0)
    const local = new Date(
        date.getTime() - date.getTimezoneOffset() * 60_000
    )
    return local.toISOString().slice(0, 16)
}

export function pageUrl(path: string, params?: Record<string, string>) {
    const query = params ? `?${new URLSearchParams(params).toString()}` : ""
    if (typeof window === "undefined") return `${path}${query}`
    return `${window.location.origin}${path}${query}`
}

export function readEventParams() {
    if (typeof window === "undefined") return { slug: "", manageToken: "" }
    const params = new URLSearchParams(window.location.search)
    return {
        slug: params.get("event") || "",
        manageToken: params.get("manage") || "",
    }
}

export function Brand({
    logo,
    logoAlt,
    brandText,
}: {
    logo?: string
    logoAlt: string
    brandText: string
}) {
    if (logo) return <img className="brand-logo" src={logo} alt={logoAlt} />
    if (brandText.toLowerCase() === "bima") {
        return (
            <div className="bima-brand">
                bi<span>ma</span><i>.</i>
            </div>
        )
    }
    return <div className="bima-brand custom">{brandText}</div>
}

export function Button({
    children,
    secondary,
    disabled,
    onClick,
    type = "button",
    href,
}: {
    children: React.ReactNode
    secondary?: boolean
    disabled?: boolean
    onClick?: () => void
    type?: "button" | "submit"
    href?: string
}) {
    const className = `bima-button ${secondary ? "secondary" : ""}`
    if (href) {
        return (
            <a className={className} href={href}>
                {children}
            </a>
        )
    }
    return (
        <button
            type={type}
            className={className}
            disabled={disabled}
            onClick={onClick}
        >
            {children}
        </button>
    )
}

export function PlaceCard({
    place,
    step,
}: {
    place: Place
    step?: number
}) {
    return (
        <article className="place-card">
            {place.image ? (
                <img src={place.image} alt="" />
            ) : (
                <div className="place-fallback">G</div>
            )}
            <div className="place-copy">
                <small>{step ? `ÉTAPE ${step} · ` : ""}GOOGLE MAPS</small>
                <h3>{place.name}</h3>
                <div className="rating">
                    <b>{place.rating || "—"}</b>
                    <span>★★★★★</span>
                    <em>{place.ratingLabel || "Consulter la note"}</em>
                </div>
                <p>{place.address || "Adresse disponible dans Google Maps"}</p>
                <strong>{place.category || "Lieu Google Maps"}</strong>
            </div>
            <a href={place.mapsUrl} target="_blank" rel="noreferrer">
                ↗
            </a>
        </article>
    )
}

export function Confirmed({
    event,
    apiBaseUrl,
}: {
    event: EventData
    apiBaseUrl: string
}) {
    const selected = event.dates.find(
        (date) => date.id === event.confirmedDateId
    )
    return (
        <div className="confirmed-card">
            <small>SORTIE CONFIRMÉE</small>
            <h2>
                Rendez-vous{" "}
                {selected ? formatDate(selected.startsAt) : "bientôt"} !
            </h2>
            <p>Le vote est clos. Il ne reste plus qu’à en profiter.</p>
            <a
                className="bima-button calendar-button"
                href={apiUrl(
                    apiBaseUrl,
                    `/api/events/${event.slug}/calendar`
                )}
            >
                ＋ Ajouter au calendrier (.ics)
            </a>
        </div>
    )
}

export function Shell({
    theme,
    children,
    showHome = true,
}: {
    theme: ThemeProps
    children: React.ReactNode
    showHome?: boolean
}) {
    const merged = { ...themeDefaults, ...theme }
    return (
        <div
            className="bima-root"
            style={
                {
                    "--accent": merged.accent,
                    "--paper": merged.backgroundColor,
                    "--card": merged.surfaceColor,
                    "--ink": merged.textColor,
                    "--muted": merged.mutedColor,
                    "--button": merged.buttonColor,
                    "--button-text": merged.buttonTextColor,
                    "--success": merged.successColor,
                } as React.CSSProperties
            }
        >
            <style>{styles}</style>
            <header className="bima-header">
                <a href={PATHS.home} aria-label="Accueil BIMA">
                    <Brand
                        logo={theme.logo}
                        logoAlt={merged.logoAlt}
                        brandText={merged.brandText}
                    />
                </a>
                {showHome && (
                    <a className="text-button" href={PATHS.home}>
                        Accueil
                    </a>
                )}
            </header>
            {children}
        </div>
    )
}

const styles = `
*{box-sizing:border-box}
.bima-root{--line:#d9d5ca;min-height:100%;width:100%;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,sans-serif}
.bima-header{height:76px;padding:0 clamp(20px,5vw,72px);display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line);background:color-mix(in srgb,var(--paper) 92%,transparent)}
.bima-header>a{text-decoration:none;color:inherit}
.bima-brand{font-size:31px;font-weight:900;letter-spacing:-2.5px}.bima-brand span{color:var(--accent)}.bima-brand i{color:#f48b5e}.bima-brand.custom{letter-spacing:-1.5px}
.brand-logo{display:block;max-width:180px;width:auto;height:34px;object-fit:contain}
.text-button,.add-link{border:0;background:none;font-weight:750;cursor:pointer;color:var(--ink);text-decoration:none}
.bima-button{border:1px solid var(--button);background:var(--button);color:var(--button-text);border-radius:999px;padding:14px 20px;font-weight:800;font-size:15px;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;gap:16px;text-decoration:none;transition:.2s}
.bima-button:hover{transform:translateY(-1px);box-shadow:0 8px 20px rgba(0,0,0,.12)}.bima-button.secondary{background:transparent;color:var(--ink);border-color:var(--ink)}.bima-button:disabled{opacity:.45;cursor:not-allowed;transform:none}
.hero-screen{min-height:calc(100vh - 76px);padding:clamp(48px,8vw,110px) clamp(20px,8vw,120px);display:grid;grid-template-columns:1.05fr .95fr;gap:8vw;align-items:center}
.hero-copy h1{font-size:clamp(52px,7vw,104px);line-height:.88;letter-spacing:-.075em;margin:18px 0 30px}.hero-copy h1 em{color:var(--accent);font-style:normal}.hero-copy p{max-width:600px;font-size:clamp(18px,2vw,24px);line-height:1.45;color:var(--muted);margin-bottom:34px}.hero-copy>.bima-button{font-size:17px;padding:18px 26px;margin:0 0 16px}.hero-copy>small:last-child{display:block;color:var(--muted)}
.eyebrow{font-size:12px;font-weight:900;letter-spacing:.13em;color:var(--accent)}
.hero-card,.form-card,.vote-card,.organizer-card,.matrix-card{background:var(--card);border:1px solid var(--line);border-radius:24px;box-shadow:0 12px 40px rgba(40,36,28,.07)}
.hero-card{padding:34px;transform:rotate(1.5deg)}.hero-card .tag{float:right;background:color-mix(in srgb,var(--success) 15%,var(--card));color:var(--success);border-radius:99px;padding:7px 10px;font-size:10px;font-weight:900}.hero-card h2{font-size:30px;margin:26px 0 5px}.hero-card>p{color:var(--muted)}
.demo-date{display:flex;justify-content:space-between;border:1px solid var(--line);border-radius:14px;padding:18px;margin-top:12px}.demo-date.winner{background:color-mix(in srgb,var(--accent) 10%,var(--card));border-color:var(--accent)}
.content-page{width:min(1120px,calc(100% - 32px));margin:auto;padding:56px 0 100px}.page-heading{text-align:center;margin-bottom:36px}.page-heading h1,.center-page h1{font-size:clamp(38px,5vw,64px);letter-spacing:-.055em;margin:10px 0}.page-heading p,.center-page>p{color:var(--muted);font-size:18px}
.form-card,.vote-card,.organizer-card{padding:clamp(22px,4vw,44px)}.form-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}.form-card label,.vote-card label{display:flex;flex-direction:column;gap:8px;font-weight:750}
.form-card input,.vote-card input,.organizer-card input{width:100%;border:1px solid var(--line);border-radius:12px;background:var(--card);padding:14px;font:inherit;outline:none}.form-card input:focus,.vote-card input:focus{border-color:var(--accent)}
.section-title{border-top:1px solid var(--line);padding-top:30px;margin-top:34px}.section-title small{font-weight:900;letter-spacing:.12em;color:var(--accent)}.section-title h2{margin:5px 0 18px}
.place-builder{margin:18px 0 24px}.input-action{display:grid;grid-template-columns:1fr auto;gap:8px}.input-action button{border:0;background:var(--accent);color:white;border-radius:12px;padding:0 16px;font-weight:800;cursor:pointer}
.place-card{display:grid;grid-template-columns:180px 1fr 38px;background:var(--card);border:1px solid var(--line);border-radius:18px;overflow:hidden;margin-top:14px;min-height:150px}.place-card img,.place-fallback{width:100%;height:100%;object-fit:cover;background:#edf0ff;display:grid;place-items:center;font-size:40px;font-weight:900;color:var(--accent)}.place-copy{padding:18px 20px}.place-copy small{font-size:10px;font-weight:900;letter-spacing:.1em;color:var(--muted)}.place-copy h3{font-size:25px;margin:6px 0}.rating{display:flex;align-items:center;gap:8px}.rating span{color:#f4a019;letter-spacing:-2px}.rating em{font-size:12px;color:var(--muted);font-style:normal}.place-copy p{margin:10px 0 5px;color:var(--muted)}.place-copy strong{font-size:12px;color:var(--muted)}.place-card>a{margin:14px 14px 0 0;width:34px;height:34px;border:1px solid var(--line);border-radius:50%;display:grid;place-items:center;text-decoration:none;color:var(--accent)}
.date-field{margin:12px 0}.add-link{color:var(--accent);padding:12px 0;margin-bottom:24px}.form-card>.bima-button{width:100%;margin-top:24px}
.center-page{width:min(720px,calc(100% - 32px));margin:auto;text-align:center;padding:70px 0}.success{width:70px;height:70px;border-radius:50%;background:color-mix(in srgb,var(--success) 15%,var(--card));color:var(--success);font-size:38px;display:grid;place-items:center;margin:0 auto 22px}.link-card{background:var(--card);border:1px solid var(--line);border-radius:20px;padding:24px;margin:22px 0;text-align:left}.link-card.private{background:color-mix(in srgb,var(--accent) 8%,var(--card))}.link-card small{display:block;font-weight:900;letter-spacing:.1em;margin-bottom:10px}.link-card code{display:block;overflow-wrap:anywhere;padding:14px;background:var(--card);border-radius:10px;margin-bottom:15px}
.event-banner{background:#171816;color:white;padding:48px clamp(20px,8vw,120px)}.event-banner small{color:#aab7ff;font-weight:900;letter-spacing:.12em}.event-banner h1{font-size:clamp(36px,5vw,64px);letter-spacing:-.05em;margin:10px 0}.event-banner p{color:#c7c6c0}.event-body{width:min(900px,calc(100% - 32px));margin:auto;padding:36px 0 100px}.itinerary{display:grid;gap:12px;margin-bottom:28px}
.vote-card h2{font-size:34px;margin:8px 0 24px}.date-options{display:grid;gap:10px;margin:20px 0}.date-options button{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:16px;display:flex;justify-content:space-between;text-align:left;font:inherit;cursor:pointer}.date-options button.selected{background:color-mix(in srgb,var(--accent) 10%,var(--card));border-color:var(--accent)}.date-options button b{color:var(--muted)}.date-options button.selected b{color:var(--accent)}.vote-card>.bima-button{width:100%}
.stage-question{border-top:1px solid var(--line);margin-top:28px;padding-top:26px}.stage-question-head{display:flex;justify-content:space-between;align-items:flex-start;gap:16px}.stage-question-head h3{font-size:25px;margin:6px 0}.stage-question-head p{margin:0;color:var(--muted);font-size:13px}.stage-summary{flex:0 0 auto;border-radius:99px;background:color-mix(in srgb,var(--ink) 7%,var(--card));padding:8px 11px;font-size:11px;font-weight:850}.stage-options{display:grid;gap:10px;margin:18px 0 8px}.stage-options button{border:1px solid var(--line);background:var(--card);border-radius:14px;padding:15px;display:flex;align-items:center;justify-content:space-between;gap:14px;text-align:left;font:inherit;cursor:pointer}.stage-options button.selected{background:color-mix(in srgb,var(--success) 10%,var(--card));border-color:var(--success)}.stage-options button>span{display:grid;grid-template-columns:28px 1fr;align-items:center;gap:10px}.stage-options i{width:27px;height:27px;border-radius:50%;display:grid;place-items:center;background:var(--accent);color:white;font-style:normal;font-size:10px;font-weight:900}.stage-options small{display:block;color:var(--muted);font-size:10px}.stage-options button>b{color:var(--muted);font-size:12px}.stage-options button.selected>b{color:var(--success)}.stage-help{color:var(--muted);font-size:11px;margin:8px 0 24px}
.management-heading{display:flex;align-items:center;justify-content:space-between;margin-bottom:24px}.management-heading h1{font-size:44px;letter-spacing:-.05em;margin:8px 0}.status{background:color-mix(in srgb,var(--success) 15%,var(--card));color:var(--success);font-weight:900;font-size:11px;letter-spacing:.1em;border-radius:99px;padding:10px 14px}.organizer-card{margin-bottom:20px}.organizer-card>div:first-child{display:flex;flex-direction:column;margin-bottom:12px}.organizer-card small{color:var(--muted)}.horizontal{grid-template-columns:repeat(4,1fr)}.horizontal button{flex-direction:column;gap:6px}
.matrix-card{padding:0;overflow:hidden}.matrix-head{display:flex;align-items:center;justify-content:space-between;padding:26px 28px;border-bottom:1px solid var(--line)}.matrix-scroll{overflow-x:auto}.matrix{display:grid;min-width:650px}.cell{padding:16px;border-right:1px solid var(--line);border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:center}.cell.heading{font-size:11px;font-weight:900;letter-spacing:.05em;background:color-mix(in srgb,var(--ink) 5%,var(--card));text-align:center}.cell.person{align-items:flex-start;flex-direction:column}.cell.person small{color:var(--muted)}.cell.answer{font-size:24px;font-weight:900;color:var(--accent)}.cell.total{font-weight:900;background:color-mix(in srgb,var(--accent) 10%,var(--card))}.cell .bima-button{padding:9px 12px;font-size:12px}
.stage-matrix-card{margin-top:20px}.stage-matrix-card .matrix-head p{margin:4px 0 0;color:var(--muted);font-size:12px}.organizer-stage-title{margin-top:24px;padding-top:20px;border-top:1px solid var(--line)}
.confirmed-card{background:var(--accent);color:white;border-radius:24px;padding:34px;margin-top:24px;text-align:center}.confirmed-card small{font-weight:900;letter-spacing:.12em}.confirmed-card h2{font-size:34px;margin:10px 0}.calendar-button{display:inline-flex;margin-top:18px;background:var(--card);border-color:var(--card);color:var(--accent)}
.error-box{background:#fff0ed;color:#a93b25;border:1px solid #efb9ac;border-radius:12px;padding:13px 15px;margin:14px 0}.toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);background:#171816;color:white;border-radius:99px;padding:12px 20px;font-weight:800;z-index:20}.loading{padding:80px;text-align:center;font-weight:800}
@media(max-width:760px){.hero-screen{grid-template-columns:1fr;padding-top:48px}.hero-card{transform:none}.form-grid{grid-template-columns:1fr}.place-card{grid-template-columns:100px 1fr 30px}.horizontal{grid-template-columns:1fr 1fr}.management-heading,.matrix-head{align-items:flex-start;flex-direction:column;gap:14px}.input-action{grid-template-columns:1fr}.input-action button{padding:13px}.bima-header{height:64px}.hero-screen{min-height:calc(100vh - 64px)}}
@media(max-width:520px){.place-card{grid-template-columns:1fr 34px}.place-card img,.place-fallback{grid-column:1/-1;height:160px}.place-copy{padding:16px}.place-card>a{grid-column:2;grid-row:2}.hero-copy h1{font-size:50px}.form-card,.vote-card{padding:20px}.content-page{padding-top:34px}.stage-question-head{display:block}.stage-summary{display:inline-block;margin-top:10px}.stage-options button{align-items:flex-start;flex-direction:column}}
`
