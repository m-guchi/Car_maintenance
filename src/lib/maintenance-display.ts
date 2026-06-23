export function formatMaintenanceRemainingKm(remainingKm: number): string {
  const absolute = Math.abs(remainingKm);
  const formatted = absolute.toLocaleString("ja-JP");

  if (remainingKm < 0) {
    return `超過 ${formatted} km`;
  }

  return `あと ${formatted} km`;
}

export function formatMaintenanceRemainingDays(remainingDays: number): string {
  const absolute = Math.abs(remainingDays);
  const formatted = absolute.toLocaleString("ja-JP");

  if (remainingDays < 0) {
    return `超過 ${formatted} 日`;
  }

  return `あと ${formatted} 日`;
}

export function formatMaintenanceIntervalKm(intervalKm: number): string {
  return `${intervalKm.toLocaleString("ja-JP")} km ごと`;
}

export function formatMaintenanceIntervalDays(intervalDays: number): string {
  return `${intervalDays.toLocaleString("ja-JP")} 日ごと`;
}
