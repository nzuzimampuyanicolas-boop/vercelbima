"use client";

import { useState } from "react";
import { calendarPath, calendarShareData, shareCalendar } from "../lib/calendar-sharing";

type Props = {
  slug: string;
  title: string;
  dateLabel: string;
  isStay: boolean;
  onCopy: (text: string, message?: string) => Promise<void>;
};

export default function CalendarSharingActions({ slug, title, dateLabel, isStay, onCopy }: Props) {
  const [fallbackVisible, setFallbackVisible] = useState(false);
  const [copyError, setCopyError] = useState("");
  const [status, setStatus] = useState("");
  const [sharing, setSharing] = useState(false);
  const path = calendarPath(slug);
  const absoluteCalendarUrl = () => new URL(path, window.location.origin).toString();

  const copyCalendar = async (withMessage = false) => {
    setCopyError("");
    setStatus("");
    const data = calendarShareData(title, dateLabel, absoluteCalendarUrl());
    try {
      const message = withMessage
        ? "Message copié · colle-le dans ton groupe"
        : "Lien copié · colle-le dans ton groupe";
      await onCopy(withMessage ? `${data.text}\n${data.url}` : data.url, message);
      setStatus(message);
    } catch {
      setFallbackVisible(true);
      setCopyError("La copie automatique n’est pas disponible. Sélectionne le lien ci-dessous pour le copier.");
    }
  };

  const share = async () => {
    setStatus("");
    setCopyError("");
    setFallbackVisible(false);
    setSharing(true);
    const outcome = await shareCalendar(
      calendarShareData(title, dateLabel, absoluteCalendarUrl()),
      navigator.share ? (data) => navigator.share(data) : undefined,
    );
    setSharing(false);
    if (outcome === "fallback") setFallbackVisible(true);
  };

  return (
    <section className="manage-confirmed" aria-label="Partager le calendrier de la sortie confirmée">
      <div className="calendar-sharing-heading">
        <span>{isStay ? "PÉRIODE CONFIRMÉE" : "DATE CONFIRMÉE"}</span>
        <h3>{isStay ? "Le séjour est confirmé 🎉" : "La sortie est confirmée 🎉"}</h3>
        <b>{dateLabel}</b>
        <p>Envoie le lien au groupe : chacun pourra ajouter {isStay ? "le séjour" : "la sortie"} à son calendrier, sans repasser par les votes.</p>
      </div>
      <div className="calendar-sharing-actions">
        <button className="primary" type="button" onClick={() => void copyCalendar()}>Copier le lien du calendrier</button>
        <button className="secondary" type="button" disabled={sharing} onClick={() => void share()}>{sharing ? "Ouverture du partage…" : "↗ Partager le lien du calendrier"}</button>
        <a className="text-link share-link" href={path}>＋ Ajouter à mon calendrier</a>
      </div>
      {status && <p className="calendar-sharing-status">{status}</p>}
      {fallbackVisible && <div className="calendar-sharing-fallback">
        <p>Copie le lien ou le message, puis envoie-le dans la messagerie de ton choix.</p>
        {copyError && <p className="calendar-sharing-error" role="alert">{copyError}</p>}
        <label>Lien du calendrier<input type="url" readOnly value={absoluteCalendarUrl()} onFocus={(input) => input.currentTarget.select()} /></label>
        <button className="secondary" type="button" onClick={() => void copyCalendar(true)}>Copier le message et le lien</button>
      </div>}
    </section>
  );
}
