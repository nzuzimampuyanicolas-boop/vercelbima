import nodemailer from "nodemailer";

const GMAIL_SENDER = "bima.sorties@gmail.com";
const BIMA_PUBLIC_URL = (process.env.BIMA_PUBLIC_URL || "https://bima-app-sigma.vercel.app").replace(/\/$/, "");
const EMAIL_LOGO_URL = `${BIMA_PUBLIC_URL}/bima-logo-white.png`;

function emailHeader() {
  return `<div style="padding:20px 28px;background:#14545d"><img src="${EMAIL_LOGO_URL}" alt="BIMA" width="54" height="54" style="display:block;width:54px;height:54px;border:0;outline:none;text-decoration:none" /></div>`;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export type ManagementEmailResult = {
  sent: boolean;
  warning?: string;
};

type MailContent = { to: string; subject: string; text: string; html: string };

async function sendBimaEmail(content: MailContent) {
  const user = (process.env.GMAIL_USER || GMAIL_SENDER).trim().toLowerCase();
  const password = (process.env.GMAIL_APP_PASSWORD || "").replaceAll(" ", "");
  if (user !== GMAIL_SENDER || !password) throw new Error("BIMA email is not configured.");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user, pass: password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 15_000,
  });
  await transporter.sendMail({ from: `"BIMA Sorties" <${GMAIL_SENDER}>`, ...content });
}

export async function sendManagementEmail({
  to,
  organizerName,
  eventTitle,
  manageUrl,
}: {
  to: string;
  organizerName: string;
  eventTitle: string;
  manageUrl: string;
}): Promise<ManagementEmailResult> {
  const user = (process.env.GMAIL_USER || GMAIL_SENDER).trim().toLowerCase();
  const password = (process.env.GMAIL_APP_PASSWORD || "").replaceAll(" ", "");

  if (user !== GMAIL_SENDER || !password) {
    console.error("BIMA management email is not configured.");
    return {
      sent: false,
      warning: "L’e-mail n’a pas pu partir. Copie ton lien privé ci-dessous pour ne pas le perdre.",
    };
  }

  const safeName = escapeHtml(organizerName);
  const safeTitle = escapeHtml(eventTitle);
  const safeManageUrl = escapeHtml(manageUrl);
  try {
    await sendBimaEmail({
      to,
      subject: `Ton lien secret pour gérer « ${eventTitle} » 🎉`,
      text: [
        `Hello ${organizerName} 👋`,
        "",
        `Ta sortie « ${eventTitle} » est prête !`,
        "Garde ce lien pour suivre les réponses, retirer un participant et confirmer la date :",
        manageUrl,
        "",
        "À très vite,",
        "BIMA",
      ].join("\n"),
      html: `
        <div style="margin:0;background:#fffaf4;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#141613">
          <div style="max-width:560px;margin:auto;background:#fff;border:1px solid #ead8c8;border-radius:20px;overflow:hidden">
            ${emailHeader()}
            <div style="padding:30px 28px">
              <p style="margin:0 0 8px;color:#ed633d;font-weight:800">C’EST PARTI 🎉</p>
              <h1 style="margin:0 0 16px;font-size:30px;line-height:1.1">Hello ${safeName} !</h1>
              <p style="margin:0 0 22px;line-height:1.6">Ta sortie <strong>${safeTitle}</strong> est prête. Depuis ton espace privé, tu peux suivre les réponses, retirer un participant et confirmer la date.</p>
              <a href="${safeManageUrl}" style="display:inline-block;border-radius:999px;background:#ed633d;color:#fff;padding:14px 22px;text-decoration:none;font-weight:800">Ouvrir mon espace de gestion →</a>
              <p style="margin:24px 0 0;color:#60777a;font-size:13px;line-height:1.55">Ce lien est privé : garde-le précieusement et ne le partage pas avec les invités.</p>
            </div>
          </div>
        </div>`,
    });
    return { sent: true };
  } catch (error) {
    console.error("BIMA management email failed", error instanceof Error ? error.message : "Unknown SMTP error");
    return {
      sent: false,
      warning: "L’e-mail n’a pas pu partir. Copie ton lien privé ci-dessous pour ne pas le perdre.",
    };
  }
}

export async function sendManagementRecoveryEmail({
  to,
  organizerName,
  events,
}: {
  to: string;
  organizerName: string;
  events: Array<{ title: string; manageUrl: string; eventType: "outing" | "stay" }>;
}) {
  const safeName = escapeHtml(organizerName || "l’organisateur");
  const textLinks = events.flatMap((event) => [event.title, event.manageUrl, ""]);
  const htmlLinks = events.map((event) => {
    const safeTitle = escapeHtml(event.title);
    const safeUrl = escapeHtml(event.manageUrl);
    const label = event.eventType === "stay" ? "séjour" : "sortie";
    return `<div style="margin:0 0 14px;padding:16px;border:1px solid #ead8c8;border-radius:14px;background:#fffaf4"><p style="margin:0 0 10px;font-size:17px;font-weight:800">${safeTitle}</p><a href="${safeUrl}" style="display:inline-block;border-radius:999px;background:#ed633d;color:#fff;padding:11px 17px;text-decoration:none;font-weight:800">Gérer ${label} →</a></div>`;
  }).join("");

  await sendBimaEmail({
    to,
    subject: events.length > 1 ? "Tes liens privés BIMA sont de retour 🔐" : `Ton lien privé pour « ${events[0]?.title || "ta sortie"} »`,
    text: [
      `Hello ${organizerName || "toi"} 👋`,
      "",
      "Tu nous as demandé de retrouver tes accès privés BIMA.",
      "",
      ...textLinks,
      "Ces liens sont privés : ne les partage pas avec les invités.",
      "",
      "À très vite,",
      "BIMA",
    ].join("\n"),
    html: `<div style="margin:0;background:#fffaf4;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#141613"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #ead8c8;border-radius:20px;overflow:hidden">${emailHeader()}<div style="padding:30px 28px"><p style="margin:0 0 8px;color:#ed633d;font-weight:800">ACCÈS RETROUVÉ 🔐</p><h1 style="margin:0 0 16px;font-size:30px;line-height:1.1">Hello ${safeName} !</h1><p style="margin:0 0 22px;line-height:1.6">Voici ${events.length > 1 ? "tes nouveaux liens privés" : "ton nouveau lien privé"} pour retrouver tes espaces de gestion.</p>${htmlLinks}<p style="margin:22px 0 0;color:#60777a;font-size:13px;line-height:1.55">Ces liens donnent accès aux réponses et à la confirmation. Garde-les pour toi.</p></div></div></div>`,
  });
}

export type OrganizerNotificationKind = "participant_joined" | "event_full" | "deadline_48h" | "deadline_reached";

export async function sendOrganizerNotificationEmail({
  kind,
  to,
  organizerName,
  eventTitle,
  manageUrl,
  participantName,
  participantCount,
  maxPlaces,
  bestDateLabel,
}: {
  kind: OrganizerNotificationKind;
  to: string;
  organizerName: string;
  eventTitle: string;
  manageUrl: string;
  participantName?: string;
  participantCount: number;
  maxPlaces: number;
  bestDateLabel?: string;
}) {
  const copy = {
    participant_joined: {
      eyebrow: "UNE RÉPONSE DE PLUS 🎉",
      subject: `${participantName || "Un invité"} a répondu à « ${eventTitle} »`,
      title: `${participantName || "Un invité"} est dans la boucle !`,
      message: `Vous êtes maintenant ${participantCount} sur ${maxPlaces} places. Jette un œil aux disponibilités et aux étapes choisies.`,
      cta: "Voir les réponses →",
    },
    event_full: {
      eyebrow: "C’EST COMPLET 🔥",
      subject: `Toutes les places sont prises pour « ${eventTitle} »`,
      title: `${maxPlaces} sur ${maxPlaces} : plus une chaise de libre !`,
      message: "Le groupe est au complet. Il ne reste plus qu’à regarder les disponibilités et confirmer le bon moment.",
      cta: "Choisir la date →",
    },
    deadline_48h: {
      eyebrow: "PETIT COUP DE COUDE ⏰",
      subject: `Plus que 48 h pour les réponses à « ${eventTitle} »`,
      title: "La date limite approche",
      message: `${participantCount} personne${participantCount > 1 ? "s ont" : " a"} répondu sur ${maxPlaces} places. C’est le bon moment pour relancer le groupe.`,
      cta: "Relancer le groupe →",
    },
    deadline_reached: {
      eyebrow: "À TOI DE TRANCHER 👀",
      subject: `Il est temps de confirmer « ${eventTitle} »`,
      title: "Tout le monde a parlé. Enfin, presque.",
      message: bestDateLabel ? `Le meilleur choix actuel est ${bestDateLabel}. Ouvre les résultats et confirme la sortie.` : "La date limite est arrivée. Ouvre les résultats et choisis le meilleur moment.",
      cta: "Confirmer la sortie →",
    },
  }[kind];
  const safeName = escapeHtml(organizerName);
  const safeTitle = escapeHtml(eventTitle);
  const safeMessage = escapeHtml(copy.message);
  const safeManageUrl = escapeHtml(manageUrl);
  await sendBimaEmail({
    to,
    subject: copy.subject,
    text: [`Hello ${organizerName} 👋`, "", copy.title, copy.message, "", manageUrl, "", "À très vite,", "BIMA"].join("\n"),
    html: `<div style="margin:0;background:#fffaf4;padding:32px 16px;font-family:Inter,Arial,sans-serif;color:#141613"><div style="max-width:560px;margin:auto;background:#fff;border:1px solid #ead8c8;border-radius:20px;overflow:hidden">${emailHeader()}<div style="padding:30px 28px"><p style="margin:0 0 8px;color:#ed633d;font-weight:800">${copy.eyebrow}</p><h1 style="margin:0 0 16px;font-size:30px;line-height:1.1">Hello ${safeName} !</h1><p style="margin:0 0 8px;font-size:19px;font-weight:800">${safeTitle}</p><p style="margin:0 0 22px;line-height:1.6">${safeMessage}</p><a href="${safeManageUrl}" style="display:inline-block;border-radius:999px;background:#ed633d;color:#fff;padding:14px 22px;text-decoration:none;font-weight:800">${copy.cta}</a><p style="margin:24px 0 0;color:#60777a;font-size:13px;line-height:1.55">Tu peux modifier les e-mails reçus depuis ton espace de gestion.</p></div></div></div>`,
  });
}
