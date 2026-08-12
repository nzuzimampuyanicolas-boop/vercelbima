import * as React from "react"
import { addPropertyControls } from "framer"
import {
    apiUrl,
    Button,
    DEFAULT_API,
    EventPayload,
    initialDate,
    knownPlaces,
    pageUrl,
    PATHS,
    Place,
    PlaceCard,
    requestJson,
    Shell,
    ThemeProps,
    themeControls,
} from "./BimaKit"

type CreateProps = ThemeProps

/**
 * @framerSupportedLayoutWidth any
 * @framerSupportedLayoutHeight auto
 * @framerIntrinsicWidth 1200
 * @framerIntrinsicHeight 900
 */
export default function BimaCreate({
    apiBaseUrl = DEFAULT_API,
    ...theme
}: CreateProps) {
    const [organizerName, setOrganizerName] = React.useState("Camille")
    const [title, setTitle] = React.useState("Brunch d'été ☀️")
    const [city, setCity] = React.useState("Paris")
    const [maxPlaces, setMaxPlaces] = React.useState(8)
    const [budget, setBudget] = React.useState(30)
    const [deadline, setDeadline] = React.useState(() =>
        initialDate(5, 18).slice(0, 10)
    )
    const [mapsUrls, setMapsUrls] = React.useState([
        knownPlaces[0].place.mapsUrl,
        knownPlaces[1].place.mapsUrl,
    ])
    const [places, setPlaces] = React.useState<Array<Place | null>>([
        knownPlaces[0].place,
        knownPlaces[1].place,
    ])
    const [dates, setDates] = React.useState([
        initialDate(10, 19),
        initialDate(16, 20),
    ])
    const [created, setCreated] = React.useState<EventPayload | null>(null)
    const [loading, setLoading] = React.useState(false)
    const [error, setError] = React.useState("")
    const [toast, setToast] = React.useState("")

    const showToast = (message: string) => {
        setToast(message)
        window.setTimeout(() => setToast(""), 2200)
    }

    async function previewPlace(index: number) {
        const value = mapsUrls[index].trim()
        if (!value) return
        const known = knownPlaces.find((candidate) =>
            value.includes(candidate.id)
        )
        if (known) {
            const next = [...places]
            next[index] = { ...known.place, mapsUrl: value }
            setPlaces(next)
            showToast(`${known.place.name} reconnu`)
            return
        }
        setLoading(true)
        setError("")
        try {
            const data = await requestJson<{ place: Place }>(
                apiUrl(apiBaseUrl, "/api/places"),
                {
                    method: "POST",
                    body: JSON.stringify({ url: value }),
                }
            )
            const next = [...places]
            next[index] = { ...data.place, mapsUrl: value }
            setPlaces(next)
            showToast(`${data.place.name} reconnu`)
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Lien Google Maps invalide."
            )
        } finally {
            setLoading(false)
        }
    }

    async function createEvent(event: React.FormEvent) {
        event.preventDefault()
        setLoading(true)
        setError("")
        try {
            const validPlaces = places.filter(
                (place): place is Place => Boolean(place)
            )
            if (!validPlaces.length) {
                throw new Error("Prévisualise au moins un lieu.")
            }
            const data = await requestJson<EventPayload>(
                apiUrl(apiBaseUrl, "/api/events"),
                {
                    method: "POST",
                    body: JSON.stringify({
                        organizerName,
                        title,
                        city,
                        maxPlaces: Math.max(2, Math.round(maxPlaces)),
                        budgetEur: Math.max(
                            10,
                            Math.round(budget / 10) * 10
                        ),
                        responseDeadline: deadline,
                        places: validPlaces.map((place, index) => ({
                            ...place,
                            startTime: index === 0 ? "12:30" : "15:30",
                        })),
                        dates: dates.map((date) =>
                            new Date(date).toISOString()
                        ),
                    }),
                }
            )
            setCreated(data)
        } catch (reason) {
            setError(
                reason instanceof Error
                    ? reason.message
                    : "Création impossible."
            )
        } finally {
            setLoading(false)
        }
    }

    async function copy(text: string) {
        await navigator.clipboard.writeText(text)
        showToast("Lien copié")
    }

    const publicUrl = created
        ? pageUrl(PATHS.guest, { event: created.event.slug })
        : ""
    const manageUrl =
        created?.manageToken && created.event.slug
            ? pageUrl(PATHS.manage, {
                  event: created.event.slug,
                  manage: created.manageToken,
              })
            : ""

    return (
        <Shell theme={{ apiBaseUrl, ...theme }}>
            {created ? (
                <main className="center-page">
                    <div className="success">✓</div>
                    <small className="eyebrow">C’EST PARTI</small>
                    <h1>Ta sortie est créée.</h1>
                    <p>
                        Envoie le premier lien aux invités. Garde le second pour
                        toi.
                    </p>
                    <div className="link-card">
                        <small>LIEN À PARTAGER</small>
                        <code>{publicUrl}</code>
                        <Button onClick={() => void copy(publicUrl)}>
                            Copier le lien invité
                        </Button>
                    </div>
                    <div className="link-card private">
                        <small>LIEN PRIVÉ ORGANISATEUR</small>
                        <code>{manageUrl}</code>
                        <Button
                            secondary
                            onClick={() => void copy(manageUrl)}
                        >
                            Copier mon lien de gestion
                        </Button>
                    </div>
                    <Button secondary href={manageUrl}>
                        Ouvrir le tableau de bord
                    </Button>
                </main>
            ) : (
                <main className="content-page">
                    <div className="page-heading">
                        <small className="eyebrow">CRÉER UNE SORTIE</small>
                        <h1>On organise quoi ?</h1>
                        <p>Le formulaire est réellement enregistré.</p>
                    </div>
                    <form className="form-card" onSubmit={createEvent}>
                        <div className="form-grid">
                            <label>
                                <span>Ton prénom</span>
                                <input
                                    value={organizerName}
                                    onChange={(event) =>
                                        setOrganizerName(event.target.value)
                                    }
                                />
                            </label>
                            <label>
                                <span>Nom de la sortie</span>
                                <input
                                    value={title}
                                    onChange={(event) =>
                                        setTitle(event.target.value)
                                    }
                                />
                            </label>
                            <label>
                                <span>Ville</span>
                                <input
                                    value={city}
                                    onChange={(event) =>
                                        setCity(event.target.value)
                                    }
                                />
                            </label>
                            <label>
                                <span>Nombre de places</span>
                                <input
                                    type="number"
                                    min={2}
                                    value={maxPlaces}
                                    onChange={(event) =>
                                        setMaxPlaces(
                                            Math.max(
                                                2,
                                                Number(event.target.value)
                                            )
                                        )
                                    }
                                />
                            </label>
                            <label>
                                <span>Budget par personne</span>
                                <input
                                    type="number"
                                    min={10}
                                    step={10}
                                    value={budget}
                                    onChange={(event) =>
                                        setBudget(
                                            Math.max(
                                                10,
                                                Number(event.target.value)
                                            )
                                        )
                                    }
                                />
                            </label>
                            <label>
                                <span>Répondre avant</span>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(event) =>
                                        setDeadline(event.target.value)
                                    }
                                />
                            </label>
                        </div>

                        <div className="section-title">
                            <small>ITINÉRAIRE</small>
                            <h2>Jusqu’à deux lieux</h2>
                        </div>
                        {mapsUrls.map((url, index) => (
                            <div className="place-builder" key={index}>
                                <label>
                                    <span>
                                        {index + 1}. Lien Google Maps
                                    </span>
                                    <div className="input-action">
                                        <input
                                            value={url}
                                            placeholder="https://maps.app.goo.gl/..."
                                            onChange={(event) => {
                                                const nextUrls = [...mapsUrls]
                                                nextUrls[index] =
                                                    event.target.value
                                                setMapsUrls(nextUrls)
                                                const nextPlaces = [...places]
                                                nextPlaces[index] = null
                                                setPlaces(nextPlaces)
                                            }}
                                        />
                                        <button
                                            type="button"
                                            onClick={() =>
                                                void previewPlace(index)
                                            }
                                        >
                                            Prévisualiser
                                        </button>
                                    </div>
                                </label>
                                {places[index] && (
                                    <PlaceCard
                                        place={places[index]!}
                                        step={index + 1}
                                    />
                                )}
                            </div>
                        ))}

                        <div className="section-title">
                            <small>DATES</small>
                            <h2>Quand peut-on se retrouver ?</h2>
                        </div>
                        {dates.map((date, index) => (
                            <label className="date-field" key={index}>
                                <span>Proposition {index + 1}</span>
                                <input
                                    type="datetime-local"
                                    value={date}
                                    onChange={(event) => {
                                        const next = [...dates]
                                        next[index] = event.target.value
                                        setDates(next)
                                    }}
                                />
                            </label>
                        ))}
                        {dates.length < 4 && (
                            <button
                                type="button"
                                className="add-link"
                                onClick={() =>
                                    setDates([
                                        ...dates,
                                        initialDate(
                                            20 + dates.length * 3,
                                            19
                                        ),
                                    ])
                                }
                            >
                                ＋ Ajouter une date
                            </button>
                        )}
                        {error && <div className="error-box">{error}</div>}
                        <Button type="submit" disabled={loading}>
                            {loading
                                ? "Création…"
                                : "Créer et obtenir mes liens →"}
                        </Button>
                    </form>
                </main>
            )}
            {toast && <div className="toast">{toast}</div>}
        </Shell>
    )
}

addPropertyControls(BimaCreate, themeControls)
