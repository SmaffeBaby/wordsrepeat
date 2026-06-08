import { NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/supabase-server";

const allowedTypes = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);
const extensionsByType: Record<string, string> = {
  "image/gif": "gif",
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp"
};

export async function POST(request: Request) {
  const auth = await getUserFromRequest(request);
  if ("error" in auth) return NextResponse.json({ error: auth.error }, { status: 401 });

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Нужен файл изображения" }, { status: 400 });
  }

  if (!allowedTypes.has(file.type)) {
    return NextResponse.json({ error: "Поддерживаются JPEG, PNG, WebP и GIF" }, { status: 400 });
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "Изображение должно быть до 5 МБ" }, { status: 400 });
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const publicUrl = `data:${file.type};base64,${bytes.toString("base64")}`;
  const extension = extensionsByType[file.type] ?? "png";
  const path = `${auth.user.id}/${crypto.randomUUID()}.${extension}`;

  return NextResponse.json({ path, publicUrl }, { status: 201 });
}
