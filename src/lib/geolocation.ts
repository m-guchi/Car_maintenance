export type GeolocationFailureReason =
  | "insecure-context"
  | "unsupported"
  | "permission-denied"
  | "unavailable"
  | "timeout"
  | "unknown";

/** 位置情報が使えないときの地図中心（大阪駅） */
export const OSAKA_STATION_FALLBACK = {
  lat: 34.702485,
  lon: 135.49595,
  label: "大阪駅",
} as const;

export function getGeolocationFallbackNotice(reason?: GeolocationFailureReason): string {
  switch (reason) {
    case "insecure-context":
      return "この URL では位置情報を利用できないため、大阪駅周辺を表示しています。";
    case "unsupported":
      return "このブラウザは位置情報に対応していないため、大阪駅周辺を表示しています。";
    case "permission-denied":
      return "位置情報の利用が拒否されたため、大阪駅周辺を表示しています。";
    case "unavailable":
      return "位置情報を取得できなかったため、大阪駅周辺を表示しています。";
    case "timeout":
      return "位置情報の取得がタイムアウトしたため、大阪駅周辺を表示しています。";
    default:
      return "位置情報を取得できなかったため、大阪駅周辺を表示しています。";
  }
}

export function isGeolocationSupported(): boolean {
  return typeof navigator !== "undefined" && "geolocation" in navigator;
}

export function isGeolocationSecureContext(): boolean {
  return typeof window !== "undefined" && window.isSecureContext;
}

export function getGeolocationBlockedMessage(): string | null {
  if (!isGeolocationSupported()) {
    return "このブラウザは位置情報に対応していません。";
  }

  if (!isGeolocationSecureContext()) {
    return [
      "この URL では位置情報を利用できません（HTTPS または localhost が必要です）。",
      "開発時は PC のブラウザで http://localhost:3000 を開いてください。",
      "スマホの LAN 用 URL（sslip.io など）では現在地の自動取得は使えません。大阪駅周辺の地図を表示します。",
    ].join(" ");
  }

  return null;
}

export function getGeolocationErrorMessage(code: number): {
  reason: GeolocationFailureReason;
  message: string;
} {
  switch (code) {
    case 1:
      return {
        reason: "permission-denied",
        message: [
          "位置情報の利用が拒否されました。",
          "アドレスバー左のサイト設定から「位置情報」を許可してください。",
          "開発時は http://localhost:3000 で開いているかも確認してください。",
        ].join(" "),
      };
    case 2:
      return {
        reason: "unavailable",
        message:
          "位置情報を取得できませんでした。Windows の「位置情報サービス」がオンか確認してください。",
      };
    case 3:
      return {
        reason: "timeout",
        message: "位置情報の取得がタイムアウトしました。もう一度お試しください。",
      };
    default:
      return {
        reason: "unknown",
        message: "位置情報の取得に失敗しました。",
      };
  }
}
