import { NextResponse } from "next/server";
import { deleteCache, readCache, writeCache } from "@/lib/redis";
import { getUserFromRequest } from "@/lib/supabase-server";
import type { Category } from "@/lib/types";

export async function GET(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const cacheKey = `categories:${auth.user.id}`;
  const cached = await readCache<Category[]>(cacheKey);
  if (cached) return NextResponse.json(cached);

  const { data, error } = await auth.supabase
    .from("categories")
    .select("*, cards(count)")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const categories = (data ?? []).map((category) => ({
    ...category,
    cards_count: category.cards?.[0]?.count ?? 0
  }));

  await writeCache(cacheKey, categories);
  return NextResponse.json(categories);
}

export async function POST(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as { title?: string; color?: string };
  const title = body.title?.trim();

  if (!title) {
    return NextResponse.json({ error: "Название категории обязательно" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("categories")
    .insert({
      title,
      color: body.color ?? "#2f8f6b",
      user_id: auth.user.id
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteCache(
    `categories:${auth.user.id}`,
    `cards:${auth.user.id}:all`,
    `cards:${auth.user.id}:due`,
    `cards:${auth.user.id}:all:all`,
    `cards:${auth.user.id}:due:all`
  );
  return NextResponse.json(data, { status: 201 });
}
