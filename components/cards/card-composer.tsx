"use client";

import { useCardImageUpload } from "@/hooks/use-card-image-upload";
import type { Card, Category } from "@/lib/types";
import { REVIEW_INTERVALS } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { Button, FileInput, Label, Select, Textarea, TextInput } from "flowbite-react";
import { ImagePlus, Plus } from "lucide-react";
import { useEffect, useState } from "react";

export function CardComposer({
  authFetch,
  categories,
  onCreated,
  selectedCategory
}: {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  categories: Category[];
  onCreated: () => void;
  selectedCategory: string;
}) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [hint, setHint] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [interval, setInterval] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const { imageUrl, setImageUrl, uploadError, uploading, uploadImage } = useCardImageUpload(authFetch);

  useEffect(() => {
    if (selectedCategory !== "all") setCategoryId(selectedCategory);
    else if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }, [categories, categoryId, selectedCategory]);

  const createCard = useMutation({
    mutationFn: () =>
      authFetch<Card>("/api/cards", {
        method: "POST",
        body: JSON.stringify({
          category_id: categoryId,
          title,
          value,
          hint,
          image_url: imageUrl,
          interval_minutes: interval
        })
      }),
    onSuccess: () => {
      setTitle("");
      setValue("");
      setHint("");
      setImageUrl(null);
      setError(null);
      onCreated();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить карточку");
    }
  });

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <Plus className="h-4 w-4" />
        Новая карточка
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <div className="space-y-3">
          <TextInput placeholder="Заголовок" value={title} onChange={(event) => setTitle(event.target.value)} />
          <Textarea
            rows={4}
            placeholder="Значение, перевод или объяснение"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
          <TextInput placeholder="Подсказка" value={hint} onChange={(event) => setHint(event.target.value)} />
        </div>
        <div className="space-y-3">
          <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="" disabled>
              Выберите категорию
            </option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </Select>
          <Select value={interval} onChange={(event) => setInterval(Number(event.target.value))}>
            {REVIEW_INTERVALS.map((item) => (
              <option key={item.minutes} value={item.minutes}>
                {item.label}
              </option>
            ))}
          </Select>
          <div>
            <Label htmlFor="image" value="Изображение до 5 МБ" />
            <FileInput id="image" accept="image/*" onChange={(event) => uploadImage(event.target.files?.[0] ?? null)} />
          </div>
          {imageUrl ? (
            <div className="relative h-28 overflow-hidden rounded-lg bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageUrl} alt="" className="h-full w-full object-cover" />
            </div>
          ) : null}
        </div>
      </div>
      {error || uploadError ? <p className="mt-3 text-sm text-red-600">{error ?? uploadError}</p> : null}
      <div className="mt-4 flex justify-end">
        <Button
          color="dark"
          className="bg-ink text-white enabled:hover:bg-gray-800"
          disabled={!categoryId || !title.trim() || !value.trim() || uploading}
          isProcessing={createCard.isPending || uploading}
          onClick={() => createCard.mutate()}
        >
          <ImagePlus className="mr-2 h-4 w-4" />
          Сохранить карточку
        </Button>
      </div>
    </div>
  );
}
