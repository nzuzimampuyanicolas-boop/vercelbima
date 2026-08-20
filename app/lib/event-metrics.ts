export type AvailabilityDate = {
  id: string;
  availableCount: number;
};

export function hasMultipleSteps(steps: readonly unknown[]) {
  return steps.length > 1;
}

export function getCapacityReferenceDate<T extends AvailabilityDate>(
  dates: T[],
  confirmedDateId: string | null,
  selectedDateId: string | null = null,
) {
  const confirmedDate = confirmedDateId
    ? dates.find((date) => date.id === confirmedDateId)
    : undefined;
  if (confirmedDate) return confirmedDate;

  const selectedDate = selectedDateId
    ? dates.find((date) => date.id === selectedDateId)
    : undefined;
  if (selectedDate) return selectedDate;

  return dates.reduce<T | null>((bestDate, date) => {
    if (!bestDate || date.availableCount > bestDate.availableCount) return date;
    return bestDate;
  }, null);
}

export function getCapacityCount<T extends AvailabilityDate>(
  dates: T[],
  confirmedDateId: string | null,
  selectedDateId: string | null = null,
) {
  return getCapacityReferenceDate(dates, confirmedDateId, selectedDateId)?.availableCount ?? 0;
}
