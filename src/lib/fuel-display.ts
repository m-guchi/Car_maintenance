export function formatCurrency(yen: number): string {
  return `¥${yen.toLocaleString("ja-JP")}`;
}

export function formatFuelAmount(liters: number): string {
  return `${liters.toLocaleString("ja-JP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} L`;
}

export function formatPricePerLiter(yen: number): string {
  return `¥${yen.toLocaleString("ja-JP")}/L`;
}

export function formatFuelEfficiency(kmPerLiter: number): string {
  return `${kmPerLiter.toLocaleString("ja-JP", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km/L`;
}

export function formatDistanceKmValue(km: number): string {
  return `${km.toLocaleString("ja-JP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })} km`;
}

export function formatDistanceSinceLastFill(km: number): string {
  const value = km.toLocaleString("ja-JP", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `前回から ${value} km`;
}

export function formatDistanceKm(km: number): string {
  if (km < 1000) {
    return `${Math.round(km)} m`;
  }

  return `${(km / 1000).toLocaleString("ja-JP", {
    minimumFractionDigits: 1,
    maximumFractionDigits: 1,
  })} km`;
}
