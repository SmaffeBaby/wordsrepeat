import { NextResponse } from "next/server";
import { REVIEW_INTERVALS } from "@/lib/types";
import { deleteCache, readCache, writeCache } from "@/lib/redis";
import { getUserFromRequest } from "@/lib/supabase-server";
import type { Card } from "@/lib/types";

const allowedIntervals = new Set(REVIEW_INTERVALS.map((interval) => interval.minutes));

function cardCacheKeys(userId: string) {
  return [`cards:${userId}:all`, `cards:${userId}:due`, `categories:${userId}`];
}

function cardsCacheKey(userId: string, dueOnly: boolean, categoryId: string | null) {
  const duePart = dueOnly ? "due" : "all";
  return `cards:${userId}:${duePart}:${categoryId ?? "all"}`;
}

export async function GET(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const dueOnly = searchParams.get("due") === "1";
  const categoryId = searchParams.get("categoryId");
  const cacheKey = cardsCacheKey(auth.user.id, dueOnly, categoryId);
  const cached = await readCache<Card[]>(cacheKey);
  if (cached) return NextResponse.json(cached);

  let query = auth.supabase
    .from("cards")
    .select("*, categories(id, title, color)")
    .order("due_at", { ascending: true })
    .order("deck_position", { ascending: true });

  if (dueOnly) query = query.lte("due_at", new Date().toISOString());
  if (categoryId) query = query.eq("category_id", categoryId);

  const { data, error } = await query;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeCache(cacheKey, data ?? [], dueOnly ? 10 : 30);
  return NextResponse.json(data ?? []);
}

export async function POST(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as Partial<Card>;
  const interval = Number(body.interval_minutes ?? 60);

  if (!body.category_id || !body.title?.trim() || !body.value?.trim()) {
    return NextResponse.json({ error: "Категория, заголовок и значение обязательны" }, { status: 400 });
  }

  if (!allowedIntervals.has(interval)) {
    return NextResponse.json({ error: "Неподдерживаемый интервал" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("cards")
    .insert({
      user_id: auth.user.id,
      category_id: body.category_id,
      title: body.title.trim(),
      value: body.value.trim(),
      hint: body.hint?.trim() || null,
      image_url: body.image_url || null,
      answer_image_url: body.answer_image_url || null,
      interval_minutes: interval,
      due_at: new Date().toISOString()
    })
    .select("*, categories(id, title, color)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteCache(
    ...cardCacheKeys(auth.user.id),
    `cards:${auth.user.id}:all:all`,
    `cards:${auth.user.id}:all:${body.category_id}`,
    `cards:${auth.user.id}:due:all`,
    `cards:${auth.user.id}:due:${body.category_id}`
  );
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as Partial<Card> & { id?: string };

  if (!body.id) return NextResponse.json({ error: "Нужен id карточки" }, { status: 400 });

  const updates: Partial<Card> = {};
  if (body.title !== undefined) updates.title = body.title.trim();
  if (body.value !== undefined) updates.value = body.value.trim();
  if (body.hint !== undefined) updates.hint = body.hint?.trim() || null;
  if (body.image_url !== undefined) updates.image_url = body.image_url;
  if (body.answer_image_url !== undefined) updates.answer_image_url = body.answer_image_url;
  if (body.category_id !== undefined) updates.category_id = body.category_id;
  if (body.interval_minutes !== undefined) {
    const interval = Number(body.interval_minutes);
    if (!allowedIntervals.has(interval)) {
      return NextResponse.json({ error: "Неподдерживаемый интервал" }, { status: 400 });
    }
    updates.interval_minutes = interval;
  }

  const { data: currentCard, error: currentCardError } = await auth.supabase
    .from("cards")
    .select("category_id")
    .eq("id", body.id)
    .single();

  if (currentCardError) return NextResponse.json({ error: currentCardError.message }, { status: 500 });

  const { data, error } = await auth.supabase
    .from("cards")
    .update(updates)
    .eq("id", body.id)
    .select("*, categories(id, title, color)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteCache(
    ...cardCacheKeys(auth.user.id),
    `cards:${auth.user.id}:all:all`,
    `cards:${auth.user.id}:all:${currentCard.category_id}`,
    `cards:${auth.user.id}:all:${data.category_id}`,
    `cards:${auth.user.id}:due:all`,
    `cards:${auth.user.id}:due:${currentCard.category_id}`,
    `cards:${auth.user.id}:due:${data.category_id}`
  );
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as { id?: string };

  if (!body.id) return NextResponse.json({ error: "Нужен id карточки" }, { status: 400 });

  const { data: currentCard, error: currentCardError } = await auth.supabase
    .from("cards")
    .select("category_id")
    .eq("id", body.id)
    .single();

  if (currentCardError) return NextResponse.json({ error: currentCardError.message }, { status: 500 });

  const { error } = await auth.supabase.from("cards").delete().eq("id", body.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteCache(
    ...cardCacheKeys(auth.user.id),
    `cards:${auth.user.id}:all:all`,
    `cards:${auth.user.id}:all:${currentCard.category_id}`,
    `cards:${auth.user.id}:due:all`,
    `cards:${auth.user.id}:due:${currentCard.category_id}`
  );

  return NextResponse.json({ ok: true });
}
