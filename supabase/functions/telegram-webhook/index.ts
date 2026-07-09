const PHOTO_URL =
  "https://jqtputqzlfxmmisamlje.supabase.co/storage/v1/object/public/photos/Untitled%20folder/welcome.jpg";

const WEB_APP_URL = "https://web.telegram.org/k/#@wellwellwell_app_bot";

const CAPTION = `Well Well Well — среда для регулярных совместных активностей.

Присоединяйтесь к планам, находите единомышленников и поддерживайте регулярный ритм вместе. Вокруг этого формируется <a href="https://t.me/+1pGC-3U6KGxiODQy">сообщество wellness-энтузиастов</a>, где можно общаться, обмениваться опытом и вдохновлять друг друга.

Нажмите «Войти», чтобы открыть приложение и начать.`;

type TelegramUpdate = {
  message?: {
    chat?: {
      id?: number | string;
    };
    text?: string;
  };
};

const telegramOk = () => new Response("ok", { status: 200 });

Deno.serve(async (request: Request) => {
  if (request.method !== "POST") {
    return new Response("Method Not Allowed", { status: 405 });
  }

  const webhookSecret = Deno.env.get("TELEGRAM_WEBHOOK_SECRET");
  const requestSecret = request.headers.get(
    "X-Telegram-Bot-Api-Secret-Token",
  );

  if (!webhookSecret || requestSecret !== webhookSecret) {
    return new Response("Unauthorized", { status: 401 });
  }

  try {
    const update = (await request.json()) as TelegramUpdate;
    const text = update.message?.text;
    const chatId = update.message?.chat?.id;

    if (typeof text !== "string" || !text.startsWith("/start")) {
      return telegramOk();
    }

    const commandAndParam = text.trim().split(/\s+/, 2);
    const command = commandAndParam[0].split("@", 1)[0];

    if (command !== "/start" || chatId === undefined) {
      return telegramOk();
    }

    const startParam = commandAndParam[1];
    if (startParam) {
      console.log("start_param", startParam);
    }

    const botToken = Deno.env.get("TELEGRAM_BOT_TOKEN");
    if (!botToken) {
      console.error("TELEGRAM_BOT_TOKEN is not configured");
      return telegramOk();
    }

    const botResponse = await fetch(
      `https://api.telegram.org/bot${botToken}/sendPhoto`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: chatId,
          photo: PHOTO_URL,
          parse_mode: "HTML",
          caption: CAPTION,
          reply_markup: {
            inline_keyboard: [
              [
                {
                  text: "Войти",
                  web_app: { url: WEB_APP_URL },
                },
              ],
            ],
          },
        }),
      },
    );

    if (!botResponse.ok) {
      console.error("Telegram Bot API error", await botResponse.text());
    }
  } catch (error) {
    console.error("telegram-webhook error", error);
  }

  return telegramOk();
});
