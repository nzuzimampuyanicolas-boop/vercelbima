import * as React from "react"
import { addPropertyControls, ControlType } from "framer"
import type { PropertyControls } from "framer"
import {
    Button,
    PATHS,
    Shell,
    ThemeProps,
    themeControls,
} from "./BimaKit"

type HomeProps = ThemeProps & {
    eyebrowText?: string
    heroTitleLine1?: string
    heroTitleLine2?: string
    heroTitleAccent?: string
    heroDescription?: string
    primaryCta?: string
    microcopy?: string
    demoBadge?: string
    demoTitle?: string
    demoMeta?: string
    demoDate1?: string
    demoDate2?: string
    demoDate3?: string
}

export default function BimaHome({
    eyebrowText = "● ENFIN, ON SE DÉCIDE",
    heroTitleLine1 = "La sortie qui",
    heroTitleLine2 = "sort du",
    heroTitleAccent = "groupe.",
    heroDescription = "Propose des dates, partage le lien et laisse chacun voter. Sans compte et sans 147 messages.",
    primaryCta = "Créer une sortie",
    microcopy = "Gratuit · Aucun compte requis",
    demoBadge = "4 RÉPONSES",
    demoTitle = "Brunch d'été ☀️",
    demoMeta = "Paris · 8 personnes max.",
    demoDate1 = "Samedi 16 août",
    demoDate2 = "Vendredi 22 août",
    demoDate3 = "Samedi 23 août",
    ...theme
}: HomeProps) {
    return (
        <Shell theme={theme} showHome={false}>
            <main className="hero-screen">
                <div className="hero-copy">
                    <small className="eyebrow">{eyebrowText}</small>
                    <h1>
                        {heroTitleLine1}
                        <br />
                        {heroTitleLine2}
                        <br />
                        <em>{heroTitleAccent}</em>
                    </h1>
                    <p>{heroDescription}</p>
                    <Button href={PATHS.create}>
                        {primaryCta} <span>→</span>
                    </Button>
                    <small>{microcopy}</small>
                </div>
                <div className="hero-card">
                    <span className="tag">{demoBadge}</span>
                    <h2>{demoTitle}</h2>
                    <p>{demoMeta}</p>
                    {[demoDate1, demoDate2, demoDate3].map((date, index) => (
                        <div
                            className={`demo-date ${
                                index === 2 ? "winner" : ""
                            }`}
                            key={date}
                        >
                            <b>{date}</b>
                            <span>
                                {index === 2 ? "5/5" : `${index + 2}/5`}
                            </span>
                        </div>
                    ))}
                </div>
            </main>
        </Shell>
    )
}

const homeControls: PropertyControls<HomeProps> = {
    ...themeControls,
    eyebrowText: {
        type: ControlType.String,
        title: "Sur-titre",
        defaultValue: "● ENFIN, ON SE DÉCIDE",
    },
    heroTitleLine1: {
        type: ControlType.String,
        title: "Titre ligne 1",
        defaultValue: "La sortie qui",
    },
    heroTitleLine2: {
        type: ControlType.String,
        title: "Titre ligne 2",
        defaultValue: "sort du",
    },
    heroTitleAccent: {
        type: ControlType.String,
        title: "Titre accent",
        defaultValue: "groupe.",
    },
    heroDescription: {
        type: ControlType.String,
        title: "Description",
        displayTextArea: true,
        defaultValue:
            "Propose des dates, partage le lien et laisse chacun voter. Sans compte et sans 147 messages.",
    },
    primaryCta: {
        type: ControlType.String,
        title: "Bouton",
        defaultValue: "Créer une sortie",
    },
    microcopy: {
        type: ControlType.String,
        title: "Sous bouton",
        defaultValue: "Gratuit · Aucun compte requis",
    },
    demoBadge: {
        type: ControlType.String,
        title: "Badge démo",
        defaultValue: "4 RÉPONSES",
    },
    demoTitle: {
        type: ControlType.String,
        title: "Titre démo",
        defaultValue: "Brunch d'été ☀️",
    },
    demoMeta: {
        type: ControlType.String,
        title: "Détail démo",
        defaultValue: "Paris · 8 personnes max.",
    },
    demoDate1: {
        type: ControlType.String,
        title: "Date démo 1",
        defaultValue: "Samedi 16 août",
    },
    demoDate2: {
        type: ControlType.String,
        title: "Date démo 2",
        defaultValue: "Vendredi 22 août",
    },
    demoDate3: {
        type: ControlType.String,
        title: "Date démo 3",
        defaultValue: "Samedi 23 août",
    },
}

addPropertyControls(BimaHome, homeControls)
