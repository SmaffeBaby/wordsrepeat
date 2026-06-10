import { NextResponse } from "next/server";
import { deleteCache } from "@/lib/redis";
import { getUserFromRequest } from "@/lib/supabase-server";
import { REVIEW_INTERVALS } from "@/lib/types";
import type { Card } from "@/lib/types";

const allowedIntervals = new Set(REVIEW_INTERVALS.map((interval) => interval.minutes));
const maxImportRows = 500;

type ImportCard = Pick<Card, "title" | "value"> &
  Partial<Pick<Card, "hint" | "image_url" | "answer_image_url" | "interval_minutes">>;

type ImportBody = {
  category_id?: string;
  cards?: ImportCard[];
};

export async function POST(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as ImportBody;
  if (!body.category_id) return NextResponse.json({ error: "Выберите категорию для импорта" }, { status: 400 });

  const { data: category, error: categoryError } = await auth.supabase
    .from("categories")
    .select("id, kind")
    .eq("id", body.category_id)
    .single();

  if (categoryError || !category) {
    return NextResponse.json({ error: categoryError?.message ?? "Категория не найдена" }, { status: 404 });
  }

  if (category.kind !== "category") {
    return NextResponse.json({ error: "Импортировать карточки можно только в категорию" }, { status: 400 });
  }

  const cards = Array.isArray(body.cards) ? body.cards.slice(0, maxImportRows) : [];
  if (cards.length === 0) return NextResponse.json({ error: "В CSV нет карточек для импорта" }, { status: 400 });

  const errors: string[] = [];
  const rows = cards.flatMap((card, index) => {
    const title = card.title?.trim();
    const value = card.value?.trim();
    const interval = Number(card.interval_minutes ?? 60);

    if (!title || !value) {
      errors.push(`Строка ${index + 2}: нужны title и value`);
      return [];
    }

    if (!allowedIntervals.has(interval)) {
      errors.push(`Строка ${index + 2}: неподдерживаемый interval_minutes`);
      return [];
    }

    return [
      {
        user_id: auth.user.id,
        category_id: body.category_id,
        title,
        value,
        hint: card.hint?.trim() || null,
        image_url: card.image_url || null,
        answer_image_url: card.answer_image_url || null,
        interval_minutes: interval,
        due_at: new Date().toISOString()
      }
    ];
  });

  if (rows.length === 0) {
    return NextResponse.json({ error: errors[0] ?? "Не удалось прочитать карточки" }, { status: 400 });
  }

  const { error } = await auth.supabase.from("cards").insert(rows);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteCache(
    `categories:${auth.user.id}`,
    `cards:${auth.user.id}:all`,
    `cards:${auth.user.id}:due`,
    `cards:${auth.user.id}:all:all`,
    `cards:${auth.user.id}:all:${body.category_id}`,
    `cards:${auth.user.id}:due:all`,
    `cards:${auth.user.id}:due:${body.category_id}`
  );

  return NextResponse.json({
    inserted: rows.length,
    skipped: cards.length - rows.length,
    errors: errors.slice(0, 10)
  });
}
