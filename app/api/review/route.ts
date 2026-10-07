import { NextResponse } from "next/server";
import { REVIEW_INTERVALS } from "@/lib/types";
import { deleteCache } from "@/lib/redis";
import { getUserFromRequest } from "@/lib/supabase-server";

const allowedIntervals = new Set(REVIEW_INTERVALS.map((interval) => interval.minutes));

function clearReviewCaches(userId: string, categoryId: string) {
  return deleteCache(
    `cards:${userId}:all`,
    `cards:${userId}:due`,
    `cards:${userId}:${categoryId}`,
    `cards:${userId}:all:all`,
    `cards:${userId}:all:${categoryId}`,
    `cards:${userId}:due:all`,
    `cards:${userId}:due:${categoryId}`,
    `cards:${userId}:completed`,
    `categories:${userId}`
  );
}

export async function POST(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as {
    cardId?: string;
    result?: "again" | "done" | "learned";
    intervalMinutes?: number;
    difficulty?: number;
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
  if ((body.result === "done" || body.result === "learned") && !allowedIntervals.has(interval)) {
    return NextResponse.json({ error: "Неподдерживаемый интервал" }, { status: 400 });
  }

  const dueAt = body.result === "again" ? new Date().toISOString() : new Date(Date.now() + interval * 60 * 1000).toISOString();

  const deckPosition = body.result === "again" ? Date.now() : 0;
  const difficulty = clampDifficulty(body.difficulty);

  const { data, error } = await auth.supabase
    .from("cards")
    .update({
      completed_at: body.result === "learned" ? new Date().toISOString() : null,
      due_at: dueAt,
      interval_minutes: body.result === "done" || body.result === "learned" ? interval : card.interval_minutes,
      deck_position: deckPosition,
      difficulty
    })
    .eq("id", body.cardId)
    .select("*, categories(id, title, color, background_color, icon_color, icon_name, custom_icon_svg)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await auth.supabase.from("review_logs").insert({
    user_id: auth.user.id,
    card_id: body.cardId,
    category_id: card.category_id,
    result: body.result === "learned" ? "done" : body.result,
    interval_minutes: body.result === "done" || body.result === "learned" ? interval : null
  });

  await clearReviewCaches(auth.user.id, card.category_id);

  return NextResponse.json(data);
}

function clampDifficulty(value: unknown) {
  const difficulty = Number(value ?? 1);
  if (!Number.isFinite(difficulty)) return 1;
  return Math.max(1, Math.min(5, Math.round(difficulty)));
}
