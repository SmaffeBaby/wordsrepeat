import { NextResponse } from "next/server";
import { REVIEW_INTERVALS } from "@/lib/types";
import { deleteCache } from "@/lib/redis";
import { getUserFromRequest } from "@/lib/supabase-server";

const allowedIntervals = new Set(REVIEW_INTERVALS.map((interval) => interval.minutes));

export async function POST(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as {
    cardId?: string;
    result?: "again" | "done";
    intervalMinutes?: number;
  };

  if (!body.cardId || !body.result) {
    return NextResponse.json({ error: "Нужны cardId и result" }, { status: 400 });
  }

  const { data: card, error: cardError } = await auth.supabase
    .from("cards")
    .select("id, category_id, interval_minutes, deck_position")
    .eq("id", body.cardId)
    .single();

  if (cardError || !card) {
    return NextResponse.json({ error: cardError?.message ?? "Карточка не найдена" }, { status: 404 });
  }

  const interval = body.intervalMinutes ?? card.interval_minutes;
  if (body.result === "done" && !allowedIntervals.has(interval)) {
    return NextResponse.json({ error: "Неподдерживаемый интервал" }, { status: 400 });
  }

  const dueAt =
    body.result === "again"
      ? new Date().toISOString()
      : new Date(Date.now() + interval * 60 * 1000).toISOString();

  const deckPosition = body.result === "again" ? Date.now() : 0;

  const { data, error } = await auth.supabase
    .from("cards")
    .update({
      due_at: dueAt,
      interval_minutes: body.result === "done" ? interval : card.interval_minutes,
      deck_position: deckPosition
    })
    .eq("id", body.cardId)
    .select("*, categories(id, title, color)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auth.supabase.from("review_logs").insert({
    user_id: auth.user.id,
    card_id: body.cardId,
    category_id: card.category_id,
    result: body.result,
    interval_minutes: body.result === "done" ? interval : null
  });

  await deleteCache(
    `cards:${auth.user.id}:all`,
    `cards:${auth.user.id}:due`,
    `cards:${auth.user.id}:${card.category_id}`,
    `cards:${auth.user.id}:all:all`,
    `cards:${auth.user.id}:all:${card.category_id}`,
    `cards:${auth.user.id}:due:all`,
    `cards:${auth.user.id}:due:${card.category_id}`,
    `categories:${auth.user.id}`
  );

  return NextResponse.json(data);
}
