import * as React from "react"
import { addPropertyControls } from "framer"
import {
    apiUrl,
    Button,
    Confirmed,
    DEFAULT_API,
    EventPayload,
    formatDate,
    PlaceCard,
    readEventParams,
    requestJson,
    Shell,
    ThemeProps,
    themeControls,
} from "./BimaKit"

type GuestProps = ThemeProps

export default function BimaGuest({
    apiBaseUrl = DEFAULT_API,
    ...theme
}: GuestProps) {
    const [payload, setPayload] = React.useState<EventPayload | null>(null)
    const [guestName, setGuestName] = React.useState("")
    const [answers, setAnswers] = React.useState<Record<string, boolean>>({})
    const [stageAnswers, setStageAnswers] = React.useState<Record<string, boolean>>({})
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState("")
    const [toast, setToast] = React.useState("")

    const loadEvent = React.useCallback(async () => {
        const { slug } = readEventParams()
        if (!slug) {
            setError("Le lien de cette sortie est incomplet.")
            setLoading(false)
            return
        }
        setLoading(true)
        setError("")
        try {
            const data = await requestJson<EventPayload>(
                apiUrl(
                    apiBaseUrl,
                    `/api/events/${encodeURIComponent(slug)}`
                )
            )
            setPayload(data)
            const savedName = window.localStorage.getItem(
                `bima:${slug}:name`
            )
            if (savedName) setGuestName(savedName)
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Sortie introuvable."
            )
        } finally {
            setLoading(false)
        }
    }, [apiBaseUrl])

    React.useEffect(() => {
        void loadEvent()
    }, [loadEvent])

    async function submitVote() {
        if (!payload || !guestName.trim()) {
            setError("Indique ton prénom.")
            return
        }
        setLoading(true)
        setError("")
        try {
            const slug = payload.event.slug
            const participantToken =
                window.localStorage.getItem(
                    `bima:${slug}:participant`
                ) || undefined
            const data = await requestJson<
                EventPayload & {
                    participantToken: string
                    role: "organizer" | "guest"
                }
            >(apiUrl(apiBaseUrl, `/api/events/${slug}/votes`), {
                method: "POST",
                body: JSON.stringify({
                    name: guestName.trim(),
                    participantToken,
                    availableDateIds: payload.event.dates
                        .filter((date) => answers[date.id])
                        .map((date) => date.id),
                    availablePlaceIds: payload.event.places
                        .filter((place) => place.id && stageAnswers[place.id])
                        .map((place) => place.id),
                }),
            })
            window.localStorage.setItem(
                `bima:${slug}:participant`,
                data.participantToken
            )
            window.localStorage.setItem(
                `bima:${slug}:name`,
                guestName.trim()
            )
            setPayload(data)
            setToast("Disponibilités enregistrées")
            window.setTimeout(() => setToast(""), 2200)
        } catch (reason) {
            setError(
                reason instanceof Error ? reason.message : "Vote impossible."
            )
        } finally {
            setLoading(false)
        }
    }

    const event = payload?.event

    return (
        <Shell theme={{ apiBaseUrl, ...theme }}>
            {loading && !event && (
                <div className="loading">Chargement…</div>
            )}
            {error && !event && (
                <main className="center-page">
                    <h1>Impossible d’ouvrir la sortie</h1>
                    <div className="error-box">{error}</div>
                </main>
            )}
            {event && (
                <main className="event-page">
                    <section className="event-banner">
                        <small>
                            {event.organizerName.toUpperCase()} T’INVITE
                        </small>
                        <h1>{event.title}</h1>
                        <p>
                            {event.city} ·{" "}
                            {event.budgetEur
                                ? `${event.budgetEur} €`
                                : "Budget libre"}{" "}
                            · {event.maxPlaces} places
                        </p>
                    </section>
                    <section className="event-body">
                        <div className="itinerary">
                            {event.places.map((place, index) => (
                                <PlaceCard
                                    key={place.id || index}
                                    place={place}
                                    step={index + 1}
                                />
                            ))}
                        </div>
                        {event.status === "confirmed" ? (
                            <Confirmed
                                event={event}
                                apiBaseUrl={apiBaseUrl}
                            />
                        ) : (
                            <div className="vote-card">
                                <small className="eyebrow">
                                    TES DISPONIBILITÉS
                                </small>
                                <h2>Quand peux-tu venir ?</h2>
                                <label>
                                    <span>Ton prénom</span>
                                    <input
                                        value={guestName}
                                        onChange={(event) =>
                                            setGuestName(event.target.value)
                                        }
                                        placeholder="Alex"
                                    />
                                </label>
                                <div className="date-options">
                                    {event.dates.map((date) => (
                                        <button
                                            key={date.id}
                                            className={
                                                answers[date.id]
                                                    ? "selected"
                                                    : ""
                                            }
                                            onClick={() =>
                                                setAnswers({
                                                    ...answers,
                                                    [date.id]:
                                                        !answers[date.id],
                                                })
                                            }
                                        >
                                            <span>
                                                {formatDate(date.startsAt)}
                                            </span>
                                            <b>
                                                {answers[date.id]
                                                    ? "✓ Disponible"
                                                    : "Pas disponible"}
                                            </b>
                                        </button>
                                    ))}
                                </div>
                                <section className="stage-question">
                                    <div className="stage-question-head">
                                        <div>
                                            <small className="eyebrow">TON PROGRAMME</small>
                                            <h3>À quelles étapes seras-tu là ?</h3>
                                            <p>Choisis chaque partie de la sortie à laquelle tu participeras.</p>
                                        </div>
                                        <span className="stage-summary">
                                            {event.places.filter((place) => place.id && stageAnswers[place.id]).length === event.places.length
                                                ? "Toute la sortie"
                                                : event.places.filter((place) => place.id && stageAnswers[place.id]).length === 0
                                                  ? "Aucune étape"
                                                  : `${event.places.filter((place) => place.id && stageAnswers[place.id]).length} étape sur ${event.places.length}`}
                                        </span>
                                    </div>
                                    <div className="stage-options">
                                        {event.places.map((place, index) => {
                                            const placeId = place.id || `place-${index}`
                                            const selected = Boolean(place.id && stageAnswers[place.id])
                                            return (
                                                <button
                                                    type="button"
                                                    key={placeId}
                                                    className={selected ? "selected" : ""}
                                                    onClick={() => place.id && setStageAnswers({ ...stageAnswers, [place.id]: !selected })}
                                                    aria-pressed={selected}
                                                >
                                                    <span><i>{index + 1}</i><span><small>{place.startTime || `Étape ${index + 1}`}</small><strong>{place.name}</strong></span></span>
                                                    <b>{selected ? "✓ Je serai là" : "× Je ne serai pas là"}</b>
                                                </button>
                                            )
                                        })}
                                    </div>
                                    <p className="stage-help">Tu peux sélectionner toutes les étapes, une seule, ou aucune.</p>
                                </section>
                                {error && (
                                    <div className="error-box">{error}</div>
                                )}
                                <Button
                                    disabled={loading}
                                    onClick={() => void submitVote()}
                                >
                                    {loading
                                        ? "Enregistrement…"
                                        : "Valider mes réponses →"}
                                </Button>
                            </div>
                        )}
                    </section>
                </main>
            )}
            {toast && <div className="toast">{toast}</div>}
        </Shell>
    )
}

addPropertyControls(BimaGuest, themeControls)
