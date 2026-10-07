import { NextResponse } from "next/server";
import { deleteCache, readCache, writeCache } from "@/lib/redis";
import { getUserFromRequest } from "@/lib/supabase-server";
import type { Card } from "@/lib/types";

const completedTtlMs = 14 * 24 * 60 * 60 * 1000;

function completedCacheKey(userId: string) {
  return `cards:${userId}:completed`;
}

function clearCardCaches(userId: string, categoryId?: string | null) {
  return deleteCache(
    ...[
    `cards:${userId}:all`,
    `cards:${userId}:due`,
    `cards:${userId}:all:all`,
    `cards:${userId}:due:all`,
    `cards:${userId}:completed`,
    categoryId ? `cards:${userId}:all:${categoryId}` : null,
    categoryId ? `cards:${userId}:due:${categoryId}` : null,
    `categories:${userId}`
    ].filter((key): key is string => Boolean(key))
  );
}

export async function GET(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  await auth.supabase
    .from("cards")
    .delete()
    .not("completed_at", "is", null)
    .lte("completed_at", new Date(Date.now() - completedTtlMs).toISOString());

  const cacheKey = completedCacheKey(auth.user.id);
  const cached = await readCache<Card[]>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const { data, error } = await auth.supabase
    .from("cards")
    .select("*, categories(id, title, color, background_color, icon_color, icon_name, custom_icon_svg)")
    .not("completed_at", "is", null)
    .order("completed_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await writeCache(cacheKey, data ?? [], 30);
  return NextResponse.json(data ?? []);
}

export async function PATCH(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Нужен id карточки" }, { status: 400 });

  const { data, error } = await auth.supabase
    .from("cards")
    .update({
      completed_at: null,
      due_at: new Date().toISOString(),
      deck_position: 0
    })
    .eq("id", body.id)
    .select("*, categories(id, title, color, background_color, icon_color, icon_name, custom_icon_svg)")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await clearCardCaches(auth.user.id, data.category_id);
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as { id?: string };
  if (!body.id) return NextResponse.json({ error: "Нужен id карточки" }, { status: 400 });

  const { data: card, error: cardError } = await auth.supabase
    .from("cards")
    .select("category_id")
    .eq("id", body.id)
    .single();

  if (cardError) return NextResponse.json({ error: cardError.message }, { status: 500 });

  const { error } = await auth.supabase.from("cards").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await clearCardCaches(auth.user.id, card.category_id);
  return NextResponse.json({ ok: true });
}
