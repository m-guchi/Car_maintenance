function formatJstDateTime(date: Date): string {
  return date.toLocaleString("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

async function sendDiscordWebhook(
  webhookUrl: string | undefined,
  content: string,
): Promise<void> {
  if (!webhookUrl) {
    console.warn("[discord] Webhook URL is not configured; skipping notification.");
    return;
  }

  try {
    const response = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content }),
    });

    if (!response.ok) {
      console.error(
        `[discord] Webhook failed: ${response.status} ${response.statusText}`,
      );
    }
  } catch (error) {
    console.error("[discord] Failed to send webhook:", error);
  }
}

export async function notifyDiscordSignup(email: string): Promise<void> {
  await sendDiscordWebhook(
    process.env.DISCORD_WEBHOOK_SIGNUP_URL,
    `👤 新規ユーザーが登録されました: ${email}`,
  );
}

export async function notifyDiscordLogin(email: string): Promise<void> {
  const timestamp = formatJstDateTime(new Date());
  await sendDiscordWebhook(
    process.env.DISCORD_WEBHOOK_LOGIN_URL,
    `🔓 ユーザーがログインしました: ${email}（日時: ${timestamp}）`,
  );
}
