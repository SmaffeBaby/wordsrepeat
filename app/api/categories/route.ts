import { NextResponse } from "next/server";
import { deleteCache, readCache, writeCache } from "@/lib/redis";
import { getUserFromRequest } from "@/lib/supabase-server";
import type { Category } from "@/lib/types";

type CategoryBody = {
  background_color?: string;
  color?: string;
  custom_icon_svg?: string | null;
  icon_color?: string;
  icon_name?: string;
  kind?: "category" | "folder";
  parent_id?: string | null;
  title?: string;
};

type CategoryPatchBody = CategoryBody & {
  id?: string;
  parent_id?: string | null;
};

type CategoryDeleteBody = {
  id?: string;
};

type CategoryRelation = Pick<Category, "id" | "kind" | "parent_id">;

function categoryCacheKeys(userId: string) {
  return [
    `categories:${userId}`,
    `cards:${userId}:all`,
    `cards:${userId}:due`,
    `cards:${userId}:all:all`,
    `cards:${userId}:due:all`
  ];
}

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

  const body = (await request.json()) as CategoryBody;
  const title = body.title?.trim();
  const kind = body.kind === "folder" ? "folder" : "category";

  if (!title) {
    return NextResponse.json({ error: "Название категории обязательно" }, { status: 400 });
  }

  if (body.custom_icon_svg && (!body.custom_icon_svg.includes("<svg") || body.custom_icon_svg.length > 10000)) {
    return NextResponse.json({ error: "Нужен SVG-файл до 10 000 символов" }, { status: 400 });
  }

  const { data, error } = await auth.supabase
    .from("categories")
    .insert({
      background_color: body.background_color ?? "#eaf7f1",
      color: body.color ?? body.icon_color ?? "#2f8f6b",
      custom_icon_svg: body.custom_icon_svg ?? null,
      icon_color: body.icon_color ?? body.color ?? "#2f8f6b",
      icon_name: body.icon_name ?? (kind === "folder" ? "folder" : "tag"),
      kind,
      parent_id: body.parent_id || null,
      title,
      user_id: auth.user.id
    })
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteCache(...categoryCacheKeys(auth.user.id));
  return NextResponse.json(data, { status: 201 });
}

export async function PATCH(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as CategoryPatchBody;
  if (!body.id) return NextResponse.json({ error: "Нужен id категории" }, { status: 400 });

  const { data: categories, error: categoriesError } = await auth.supabase
    .from("categories")
    .select("id, kind, parent_id");

  if (categoriesError) return NextResponse.json({ error: categoriesError.message }, { status: 500 });

  const current = (categories ?? []).find((category) => category.id === body.id);
  if (!current) return NextResponse.json({ error: "Категория не найдена" }, { status: 404 });

  const updates: Partial<Category> = {};
  const title = body.title?.trim();
  if (body.title !== undefined) {
    if (!title) return NextResponse.json({ error: "Название категории обязательно" }, { status: 400 });
    updates.title = title;
  }
  if (body.background_color !== undefined) updates.background_color = body.background_color;
  if (body.color !== undefined) updates.color = body.color;
  if (body.icon_color !== undefined) updates.icon_color = body.icon_color;
  if (body.icon_name !== undefined) updates.icon_name = body.icon_name;
  if (body.custom_icon_svg !== undefined) {
    if (body.custom_icon_svg && (!body.custom_icon_svg.includes("<svg") || body.custom_icon_svg.length > 10000)) {
      return NextResponse.json({ error: "Нужен SVG-файл до 10 000 символов" }, { status: 400 });
    }
    updates.custom_icon_svg = body.custom_icon_svg;
  }
  if (body.kind !== undefined) {
    const nextKind = body.kind === "folder" ? "folder" : "category";
    const hasChildren = (categories ?? []).some((category) => category.parent_id === body.id);
    if (current.kind === "folder" && nextKind === "category" && hasChildren) {
      return NextResponse.json({ error: "Папку с вложенными элементами нельзя сделать категорией" }, { status: 400 });
    }
    updates.kind = nextKind;
  }

  if (body.parent_id !== undefined) {
    const parentId = body.parent_id || null;
    const parent = (categories ?? []).find((category) => category.id === parentId);
    if (parentId) {
      if (!parent) return NextResponse.json({ error: "Папка не найдена" }, { status: 404 });
      if (parent.kind !== "folder") {
        return NextResponse.json({ error: "Переносить можно только в папку" }, { status: 400 });
      }
      if (parentId === body.id || isDescendant(categories ?? [], body.id, parentId)) {
        return NextResponse.json({ error: "Нельзя перенести папку внутрь самой себя" }, { status: 400 });
      }
    }
    updates.parent_id = parentId;
  }

  const { data, error } = await auth.supabase
    .from("categories")
    .update(updates)
    .eq("id", body.id)
    .select("*")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteCache(...categoryCacheKeys(auth.user.id));
  return NextResponse.json(data);
}

export async function DELETE(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const body = (await request.json()) as CategoryDeleteBody;
  if (!body.id) return NextResponse.json({ error: "Нужен id категории" }, { status: 400 });

  const { data: category, error: categoryError } = await auth.supabase
    .from("categories")
    .select("id")
    .eq("id", body.id)
    .single();

  if (categoryError || !category) {
    return NextResponse.json({ error: categoryError?.message ?? "Категория не найдена" }, { status: 404 });
  }

  const { error } = await auth.supabase.from("categories").delete().eq("id", body.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await deleteCache(...categoryCacheKeys(auth.user.id));
  return NextResponse.json({ ok: true });
}

function isDescendant(categories: CategoryRelation[], ancestorId: string, categoryId: string) {
  const childrenByParent = new Map<string, CategoryRelation[]>();
  categories.forEach((category) => {
    if (!category.parent_id) return;
    childrenByParent.set(category.parent_id, [...(childrenByParent.get(category.parent_id) ?? []), category]);
  });

  const queue = childrenByParent.get(ancestorId)?.map((category) => category.id) ?? [];
  while (queue.length > 0) {
    const currentId = queue.shift() as string;
    if (currentId === categoryId) return true;
    (childrenByParent.get(currentId) ?? []).forEach((category) => queue.push(category.id));
  }

  return false;
}
