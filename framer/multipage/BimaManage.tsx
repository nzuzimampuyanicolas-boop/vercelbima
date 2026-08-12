import * as React from "react"
import { addPropertyControls } from "framer"
import {
    apiUrl,
    Button,
    Confirmed,
    DEFAULT_API,
    EventPayload,
    formatDate,
    pageUrl,
    PATHS,
    readEventParams,
    requestJson,
    Shell,
    ThemeProps,
    themeControls,
} from "./BimaKit"

type ManageProps = ThemeProps

export default function BimaManage({
    apiBaseUrl = DEFAULT_API,
    ...theme
}: ManageProps) {
    const [payload, setPayload] = React.useState<EventPayload | null>(null)
    const [manageToken, setManageToken] = React.useState("")
    const [organizerName, setOrganizerName] = React.useState("")
    const [answers, setAnswers] = React.useState<Record<string, boolean>>({})
    const [stageAnswers, setStageAnswers] = React.useState<Record<string, boolean>>({})
    const [loading, setLoading] = React.useState(true)
    const [error, setError] = React.useState("")
    const [toast, setToast] = React.useState("")

    const showToast = (message: string) => {
        setToast(message)
        window.setTimeout(() => setToast(""), 2200)
    }

    const loadEvent = React.useCallback(async () => {
        const params = readEventParams()
        if (!params.slug || !params.manageToken) {
            setError("Le lien organisateur est incomplet.")
            setLoading(false)
            return
        }
        setLoading(true)
        setError("")
        try {
            const data = await requestJson<EventPayload>(
                apiUrl(
                    apiBaseUrl,
                    `/api/events/${encodeURIComponent(
                        params.slug
                    )}?manage=${encodeURIComponent(params.manageToken)}`
                )
            )
            setManageToken(params.manageToken)
            setPayload(data)
            setOrganizerName(data.event.organizerName)
            const organizer = data.voters?.find(
                (voter) => voter.role === "organizer"
            )
            if (organizer) {
                setAnswers(organizer.answers)
                setStageAnswers(organizer.stageAnswers || {})
            }
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

    async function submitOrganizerVote() {
        if (!payload) return
        setLoading(true)
        setError("")
        try {
            const data = await requestJson<EventPayload>(
                apiUrl(
                    apiBaseUrl,
                    `/api/events/${payload.event.slug}/votes`
                ),
                {
                    method: "POST",
                    body: JSON.stringify({
                        name:
                            organizerName.trim() ||
                            payload.event.organizerName,
                        participantToken: manageToken,
                        availableDateIds: payload.event.dates
                            .filter((date) => answers[date.id])
                            .map((date) => date.id),
                        availablePlaceIds: payload.event.places
                            .filter((place) => place.id && stageAnswers[place.id])
                            .map((place) => place.id),
                    }),
                }
            )
            setPayload(data)
            showToast("Ton vote est enregistré")
            await loadEvent()
        } catch (reason) {
            setError(
                reason instanceof Error ? reason.message : "Vote impossible."
            )
        } finally {
            setLoading(false)
        }
    }

    async function confirmDate(dateId: string) {
        if (!payload) return
        setLoading(true)
        setError("")
        try {
            const data = await requestJson<EventPayload>(
                apiUrl(
                    apiBaseUrl,
                    `/api/events/${payload.event.slug}/confirm`
                ),
                {
                    method: "POST",
                    body: JSON.stringify({ manageToken, dateId }),
                }
            )
            setPayload(data)
            showToast("La date est confirmée")
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Confirmation impossible."
            )
        } finally {
            setLoading(false)
        }
    }

    async function copy(text: string) {
        await navigator.clipboard.writeText(text)
        showToast("Lien copié")
    }

    const event = payload?.event
    const publicUrl = event
        ? pageUrl(PATHS.guest, { event: event.slug })
        : ""

    return (
        <Shell theme={{ apiBaseUrl, ...theme }}>
            {loading && !event && (
                <div className="loading">Chargement…</div>
            )}
            {error && !event && (
                <main className="center-page">
                    <h1>Accès organisateur impossible</h1>
                    <div className="error-box">{error}</div>
                </main>
            )}
            {event && payload && (
                <main className="content-page manage-page">
                    <div className="management-heading">
                        <div>
                            <small className="eyebrow">
                                PAGE PRIVÉE · ORGANISATEUR
                            </small>
                            <h1>{event.title}</h1>
                            <p>
                                {event.city} ·{" "}
                                {payload.summary.participantCount}{" "}
                                participant(s)
                            </p>
                        </div>
                        <span className="status">
                            {event.status === "confirmed"
                                ? "CONFIRMÉE"
                                : "VOTES EN COURS"}
                        </span>
                    </div>

                    <div className="organizer-card">
                        <div>
                            <b>Mon vote</b>
                            <small>
                                Il compte comme celui des invités.
                            </small>
                        </div>
                        <input
                            value={organizerName}
                            onChange={(event) =>
                                setOrganizerName(event.target.value)
                            }
                        />
                        <div className="date-options horizontal">
                            {event.dates.map((date) => (
                                <button
                                    key={date.id}
                                    className={
                                        answers[date.id] ? "selected" : ""
                                    }
                                    onClick={() =>
                                        setAnswers({
                                            ...answers,
                                            [date.id]: !answers[date.id],
                                        })
                                    }
                                >
                                    <span>
                                        {formatDate(date.startsAt)}
                                    </span>
                                    <b>
                                        {answers[date.id] ? "✓ Oui" : "Non"}
                                    </b>
                                </button>
                            ))}
                        </div>
                        <div className="organizer-stage-title">
                            <b>Mes étapes</b>
                            <small>Je peux être présent·e à toute la sortie ou seulement à certaines étapes.</small>
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
                                        <b>{selected ? "✓ Présent·e" : "× Absent·e"}</b>
                                    </button>
                                )
                            })}
                        </div>
                        <Button
                            secondary
                            disabled={
                                loading || event.status === "confirmed"
                            }
                            onClick={() => void submitOrganizerVote()}
                        >
                            Mettre à jour mon vote
                        </Button>
                    </div>

                    <div className="matrix-card">
                        <div className="matrix-head">
                            <h2>Choisis la meilleure date</h2>
                            <Button
                                secondary
                                onClick={() => void copy(publicUrl)}
                            >
                                Copier le lien invité
                            </Button>
                        </div>
                        <div className="matrix-scroll">
                            <div
                                className="matrix"
                                style={{
                                    gridTemplateColumns: `minmax(150px, 1.4fr) repeat(${event.dates.length}, minmax(130px, 1fr))`,
                                }}
                            >
                                <div className="cell heading">
                                    PARTICIPANTS
                                </div>
                                {event.dates.map((date) => (
                                    <div
                                        className="cell heading"
                                        key={date.id}
                                    >
                                        {formatDate(date.startsAt)}
                                    </div>
                                ))}
                                {(payload.voters || []).map((voter) => (
                                    <React.Fragment key={voter.id}>
                                        <div className="cell person">
                                            <b>{voter.name}</b>
                                            <small>
                                                {voter.role === "organizer"
                                                    ? "Organisateur"
                                                    : "Invité"}
                                            </small>
                                        </div>
                                        {event.dates.map((date) => (
                                            <div
                                                className="cell answer"
                                                key={date.id}
                                            >
                                                {voter.answers[date.id]
                                                    ? "✓"
                                                    : "×"}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                                <div className="cell total">
                                    DISPONIBLES
                                </div>
                                {event.dates.map((date) => (
                                    <div className="cell total" key={date.id}>
                                        {date.availableCount}/
                                        {payload.summary.participantCount}
                                    </div>
                                ))}
                                <div className="cell" />
                                {event.dates.map((date) => (
                                    <div className="cell" key={date.id}>
                                        <Button
                                            disabled={
                                                loading ||
                                                event.status ===
                                                    "confirmed"
                                            }
                                            onClick={() =>
                                                void confirmDate(date.id)
                                            }
                                        >
                                            {event.confirmedDateId ===
                                            date.id
                                                ? "Confirmée ✓"
                                                : "Confirmer"}
                                        </Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="matrix-card stage-matrix-card">
                        <div className="matrix-head">
                            <div>
                                <h2>Présence à chaque étape</h2>
                                <p>Une personne peut rejoindre seulement une partie de la sortie.</p>
                            </div>
                        </div>
                        <div className="matrix-scroll">
                            <div
                                className="matrix"
                                style={{
                                    gridTemplateColumns: `minmax(150px, 1.4fr) repeat(${event.places.length}, minmax(150px, 1fr))`,
                                }}
                            >
                                <div className="cell heading">PARTICIPANTS</div>
                                {event.places.map((place, index) => (
                                    <div className="cell heading" key={place.id || index}>
                                        ÉTAPE {index + 1} · {place.name}
                                    </div>
                                ))}
                                {(payload.voters || []).map((voter) => (
                                    <React.Fragment key={voter.id}>
                                        <div className="cell person">
                                            <b>{voter.name}</b>
                                            <small>{voter.role === "organizer" ? "Organisateur" : "Invité"}</small>
                                        </div>
                                        {event.places.map((place, index) => (
                                            <div className="cell answer" key={place.id || index}>
                                                {place.id && voter.stageAnswers?.[place.id] ? "✓" : "×"}
                                            </div>
                                        ))}
                                    </React.Fragment>
                                ))}
                                <div className="cell total">PRÉSENTS</div>
                                {event.places.map((place, index) => (
                                    <div className="cell total" key={place.id || index}>
                                        {place.attendingCount || 0}/{payload.summary.participantCount}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {event.status === "confirmed" && (
                        <Confirmed
                            event={event}
                            apiBaseUrl={apiBaseUrl}
                        />
                    )}
                    {error && <div className="error-box">{error}</div>}
                </main>
            )}
            {toast && <div className="toast">{toast}</div>}
        </Shell>
    )
}

addPropertyControls(BimaManage, themeControls)
