"use client";

import { useCardImageUpload } from "@/hooks/use-card-image-upload";
import type { Card, Category } from "@/lib/types";
import { REVIEW_INTERVALS } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { Button, FileInput, Label, Select, Textarea, TextInput } from "flowbite-react";
import { ImagePlus, Plus, Save, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";

export function CardComposer({
  authFetch,
  categories,
  editingCard = null,
  onCancel,
  onDeleted,
  onSaved,
  selectedCategory
}: {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  categories: Category[];
  editingCard?: Card | null;
  onCancel?: () => void;
  onDeleted?: () => void;
  onSaved: () => void;
  selectedCategory: string;
}) {
  const [title, setTitle] = useState("");
  const [value, setValue] = useState("");
  const [hint, setHint] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [interval, setInterval] = useState(60);
  const [error, setError] = useState<string | null>(null);
  const mainImageUpload = useCardImageUpload(authFetch);
  const answerImageUpload = useCardImageUpload(authFetch);
  const {
    imageUrl: mainImageUrl,
    setImageUrl: setMainImageUrl,
    uploadError: mainUploadError,
    uploading: mainUploading,
    uploadImage: uploadMainImage
  } = mainImageUpload;
  const {
    imageUrl: answerImageUrl,
    setImageUrl: setAnswerImageUrl,
    uploadError: answerUploadError,
    uploading: answerUploading,
    uploadImage: uploadAnswerImage
  } = answerImageUpload;

  const isEditing = Boolean(editingCard);

  useEffect(() => {
    if (editingCard) return;
    if (selectedCategory !== "all") setCategoryId(selectedCategory);
    else if (!categoryId && categories[0]) setCategoryId(categories[0].id);
  }, [categories, categoryId, editingCard, selectedCategory]);

  useEffect(() => {
    if (!editingCard) return;
    setTitle(editingCard.title);
    setValue(editingCard.value);
    setHint(editingCard.hint ?? "");
    setCategoryId(editingCard.category_id);
    setInterval(editingCard.interval_minutes);
    setMainImageUrl(editingCard.image_url);
    setAnswerImageUrl(editingCard.answer_image_url);
    setError(null);
  }, [editingCard, setAnswerImageUrl, setMainImageUrl]);

  const saveCard = useMutation({
    mutationFn: () =>
      authFetch<Card>("/api/cards", {
        method: isEditing ? "PATCH" : "POST",
        body: JSON.stringify({
          id: editingCard?.id,
          category_id: categoryId,
          title,
          value,
          hint,
          image_url: mainImageUrl,
          answer_image_url: answerImageUrl,
          interval_minutes: interval
        })
      }),
    onSuccess: () => {
      if (!isEditing) {
        setTitle("");
        setValue("");
        setHint("");
        setMainImageUrl(null);
        setAnswerImageUrl(null);
      }
      setError(null);
      onSaved();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не удалось сохранить карточку");
    }
  });

  const deleteCard = useMutation({
    mutationFn: () =>
      authFetch<{ ok: boolean }>("/api/cards", {
        method: "DELETE",
        body: JSON.stringify({ id: editingCard?.id })
      }),
    onSuccess: () => {
      setError(null);
      onDeleted?.();
    },
    onError: (mutationError) => {
      setError(mutationError instanceof Error ? mutationError.message : "Не удалось удалить карточку");
    }
  });

  function handleDelete() {
    if (!editingCard) return;
    const confirmed = window.confirm(`Удалить карточку "${editingCard.title}"?`);
    if (confirmed) deleteCard.mutate();
  }

  const uploadError = mainUploadError ?? answerUploadError;
  const uploading = mainUploading || answerUploading;

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          {isEditing ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {isEditing ? "Редактирование карточки" : "Новая карточка"}
        </div>
        {onCancel ? (
          <Button aria-label="Закрыть редактирование" className="h-9 w-9 p-0" color="light" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        ) : null}
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
            <Label htmlFor={isEditing ? "edit-image" : "image"} value="Изображение на лицевой стороне до 5 МБ" />
            <FileInput
              id={isEditing ? "edit-image" : "image"}
              accept="image/*"
              onChange={(event) => uploadMainImage(event.target.files?.[0] ?? null)}
            />
          </div>
          {mainImageUrl ? (
            <div className="relative h-28 overflow-hidden rounded-lg bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={mainImageUrl} alt="" className="h-full w-full object-cover" />
              <Button
                aria-label="Убрать изображение на лицевой стороне"
                className="absolute right-2 top-2 h-8 w-8 p-0"
                color="light"
                onClick={() => setMainImageUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
          <div>
            <Label htmlFor={isEditing ? "edit-answer-image" : "answer-image"} value="Изображение-ответ до 5 МБ" />
            <FileInput
              id={isEditing ? "edit-answer-image" : "answer-image"}
              accept="image/*"
              onChange={(event) => uploadAnswerImage(event.target.files?.[0] ?? null)}
            />
          </div>
          {answerImageUrl ? (
            <div className="relative h-28 overflow-hidden rounded-lg bg-gray-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={answerImageUrl} alt="" className="h-full w-full object-cover" />
              <Button
                aria-label="Убрать изображение-ответ"
                className="absolute right-2 top-2 h-8 w-8 p-0"
                color="light"
                onClick={() => setAnswerImageUrl(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          ) : null}
        </div>
      </div>
      {error || uploadError ? <p className="mt-3 text-sm text-red-600">{error ?? uploadError}</p> : null}
      <div className="mt-4 flex flex-wrap justify-between gap-3">
        {isEditing ? (
          <Button color="failure" disabled={deleteCard.isPending || saveCard.isPending} onClick={handleDelete}>
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить карточку
          </Button>
        ) : (
          <span />
        )}
        <Button
          color="dark"
          className="bg-ink text-white enabled:hover:bg-gray-800"
          disabled={!categoryId || !title.trim() || !value.trim() || uploading || deleteCard.isPending}
          isProcessing={saveCard.isPending || uploading}
          onClick={() => saveCard.mutate()}
        >
          {isEditing ? <Save className="mr-2 h-4 w-4" /> : <ImagePlus className="mr-2 h-4 w-4" />}
          {isEditing ? "Сохранить изменения" : "Сохранить карточку"}
        </Button>
      </div>
    </div>
  );
}
