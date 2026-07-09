import { createClient } from "npm:@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
);
const BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN")!;
const BOT_LINK = "https://t.me/WellWellWell_New_bot";

Deno.serve(async () => {
  const from = new Date(Date.now() - 48 * 3600 * 1000).toISOString();
  const to = new Date(Date.now() - 20 * 3600 * 1000).toISOString();

  const { data: rows, error } = await supabase
    .from("plan_participants")
    .select("user_id, plan_id, updated_at")
    .eq("status", "joined")
    .is("day2_notified_at", null)
    .gte("updated_at", from)
    .lte("updated_at", to);

  if (error) return new Response(error.message, { status: 500 });

  let sent = 0;
  for (const row of rows ?? []) {
    // только реальные пользователи: telegram id всегда число
    if (!/^\d+$/.test(String(row.user_id))) continue;

    let planTitle = "твой план";
    const { data: plan } = await supabase
      .from("plans").select("payload").eq("id", row.plan_id).maybeSingle();
    if (plan?.payload?.title) planTitle = `«${plan.payload.title}»`;

    const res = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: row.user_id,
          text: `Как проходит ${planTitle}? Загляни и отметь сегодняшний шаг 💪`,
          reply_markup: {
            inline_keyboard: [[{
              text: "Открыть план",
              url: `${BOT_LINK}?startapp=plans__d2`,
            }]],
          },
        }),
      },
    );

    // помечаем отправленным и при успехе, и при 403 (пользователь не дал право писать)
    const body = await res.json();
    const isForbidden = res.status === 403 || body?.error_code === 403;
    if (isForbidden) {
      console.log("skip 403", row.user_id);
    }
    if (res.ok || isForbidden) {
      await supabase.from("plan_participants")
        .update({ day2_notified_at: new Date().toISOString() })
        .eq("user_id", row.user_id)
        .eq("plan_id", row.plan_id);
      if (res.ok) sent += 1;
    }
  }

  return new Response(JSON.stringify({ checked: rows?.length ?? 0, sent }));
});
