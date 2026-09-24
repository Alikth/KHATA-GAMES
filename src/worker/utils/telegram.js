const TELEGRAM_API = "https://api.telegram.org";

export async function telegramRequest(env, method, payload) {
  const token = String(env.TELEGRAM_BOT_TOKEN || "").trim();
  if (!token) throw new Error("TELEGRAM_BOT_TOKEN is not configured.");

  const response = await fetch(`${TELEGRAM_API}/bot${token}/${method}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload)
  });

  let data;
  try {
    data = await response.json();
  } catch {
    throw new Error("Telegram API returned an invalid response.");
  }

  if (!response.ok || !data?.ok) {
    throw new Error(data?.description || "Telegram API request failed.");
  }

  return data.result;
}

export async function sendTelegramMessage(env, text, options = {}) {
  const chatId = String(env.TELEGRAM_CHAT_ID || "").trim();
  if (!chatId) throw new Error("TELEGRAM_CHAT_ID is not configured.");

  return telegramRequest(env, "sendMessage", {
    chat_id: chatId,
    text,
    disable_web_page_preview: true,
    ...options
  });
}
