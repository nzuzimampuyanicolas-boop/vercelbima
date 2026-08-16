"use client";

import { FormEvent, useState } from "react";

export default function RecoveryForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setMessage("");
    setError("");
    try {
      const response = await fetch("/api/recover-management-link", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const payload = await response.json().catch(() => null) as { message?: string; error?: string } | null;
      if (!response.ok) throw new Error(payload?.error || "Impossible de traiter la demande.");
      setMessage(payload?.message || "Si cette adresse correspond à une sortie BIMA, l’e-mail arrive dans quelques instants.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Impossible de traiter la demande.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="recovery-form" onSubmit={submit}>
      <label htmlFor="recovery-email">E-mail utilisé pour créer la sortie</label>
      <input
        id="recovery-email"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        maxLength={254}
        autoComplete="email"
        placeholder="toi@exemple.fr"
        required
      />
      <small>Pour ta sécurité, BIMA ne dira jamais si cette adresse est enregistrée.</small>
      {message && <div className="recovery-message success" role="status">{message}</div>}
      {error && <div className="recovery-message error" role="alert">{error}</div>}
      <button className="primary" type="submit" disabled={busy}>
        {busy ? "Recherche en cours…" : "Renvoyer mon lien privé"} <span>→</span>
      </button>
    </form>
  );
}
