function normalizedCount(value: number) {
  return Number.isFinite(value) ? Math.max(0, Math.round(value)) : 0;
}

export function organizerProgressMessage(responseCount: number, availableParticipantCount: number) {
  const responses = normalizedCount(responseCount);
  const available = normalizedCount(availableParticipantCount);
  const responseLabel = responses === 1
    ? "1 invité a répondu"
    : `${responses} invités ont répondu`;
  const availabilityLabel = available === 1
    ? "1 personne est disponible à au moins une date"
    : `${available} personnes sont disponibles à au moins une date`;

  return `${responseLabel}. ${availabilityLabel}.`;
}
