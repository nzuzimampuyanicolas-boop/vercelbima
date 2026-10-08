"use client";

import { useState } from "react";
import Image from "next/image";
import styles from "./preview.module.css";

const dates = ["Vendredi 23 octobre · 19 h", "Samedi 24 octobre · 18 h", "Dimanche 25 octobre · 16 h"];

export default function InvitationPreview() {
  const [selected, setSelected] = useState<number[]>([]);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  return <div className={styles.page}>
    <header className={styles.header}><span className={styles.brand}><Image src="/bima-logo.png" alt="BIMA" width={38} height={38} /> BIMA</span><span className={styles.badge}>Exemple · preview</span></header>
    <main className={styles.main}>
      <p className={styles.eyebrow}>NICOLAS T’INVITE</p>
      <h1>Bowling entre potes <span aria-hidden="true">🎳</span></h1>
      <p className={styles.intro}>On se fait une partie ? Choisis tes dispos, on cale la date ensemble.</p>
      <section className={styles.summary} aria-label="La sortie en un coup d’œil">
        <div className={styles.place}><span aria-hidden="true" className={styles.icon}>↗</span><div><small>LE RENDEZ-VOUS</small><strong>Bowling · Conflans-Sainte-Honorine</strong><span>Le lieu proposé par Nicolas</span></div></div>
        <dl className={styles.facts}><div><dt>Budget estimé</dt><dd>20 € <small>/ personne</small></dd></div><div><dt>Quand ?</dt><dd>3 dates <small>au choix</small></dd></div><div><dt>Taille du groupe</dt><dd>8 personnes <small>maximum</small></dd></div></dl>
        <p className={styles.deadline}><span aria-hidden="true">◷</span> Réponds avant le <strong>dimanche 18 octobre</strong></p>
      </section>
      {saved ? <section className={styles.success} aria-live="polite"><span aria-hidden="true">✓</span><h2>C’est noté, {name.trim()} !</h2><p>{selected.length ? `${selected.length} date${selected.length > 1 ? "s" : ""} sélectionnée${selected.length > 1 ? "s" : ""}.` : "Tu n’es disponible à aucune de ces dates."} Dans cet exemple, aucune réponse n’est envoyée.</p><button type="button" onClick={() => setSaved(false)}>Modifier mes réponses</button></section> : <form className={styles.form} onSubmit={(event) => { event.preventDefault(); if (name.trim()) setSaved(true); }}>
        <div className={styles.voteTitle}><h2>Tu es dispo quand ?</h2><p>Coche toutes les dates qui te vont.</p></div>
        <fieldset className={styles.dates}><legend className={styles.srOnly}>Tes disponibilités</legend>{dates.map((date, index) => <label className={`${styles.date} ${selected.includes(index) ? styles.selected : ""}`} key={date}><input type="checkbox" checked={selected.includes(index)} onChange={() => setSelected(selected.includes(index) ? selected.filter(value => value !== index) : [...selected, index])} /><span>{date}</span><small>{selected.includes(index) ? "Dispo ✓" : ""}</small></label>)}</fieldset>
        <label className={styles.name}>Ton prénom<input required maxLength={80} pattern=".*\S.*" autoComplete="given-name" placeholder="Ex. Camille" value={name} onChange={event => setName(event.target.value)} /></label>
        <button className={styles.submit} type="submit">{selected.length ? "Valider mes disponibilités" : "Je ne suis pas disponible"} <span aria-hidden="true">→</span></button>
        <p className={styles.reassurance}>Sans compte. Sans installation.</p>
      </form>}
      <footer className={styles.note}>Données fictives · aperçu interactif, aucun enregistrement.</footer>
    </main>
  </div>;
}
