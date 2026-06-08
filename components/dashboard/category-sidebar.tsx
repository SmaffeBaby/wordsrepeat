"use client";

import type { Category } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { Button, TextInput } from "flowbite-react";
import { Layers3, Plus } from "lucide-react";
import { useState } from "react";

const colors = ["#2f8f6b", "#ef6f61", "#3b82f6", "#f4b860", "#8b5cf6"];

export function CategorySidebar({
  authFetch,
  cardsCount,
  categories,
  onCategoryCreated,
  selectedCategory,
  setSelectedCategory
}: {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  cardsCount: number;
  categories: Category[];
  onCategoryCreated: () => void;
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
}) {
  const [categoryTitle, setCategoryTitle] = useState("");
  const [categoryColor, setCategoryColor] = useState(colors[0]);

  const addCategory = useMutation({
    mutationFn: () =>
      authFetch<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify({ title: categoryTitle, color: categoryColor })
      }),
    onSuccess: (category) => {
      setCategoryTitle("");
      setSelectedCategory(category.id);
      onCategoryCreated();
    }
  });

  return (
    <aside className="space-y-4">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Layers3 className="h-4 w-4" />
          Категории
        </div>
        <div className="space-y-2">
          <button
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
              selectedCategory === "all" ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700"
            }`}
            onClick={() => setSelectedCategory("all")}
          >
            Все карточки
            <span>{cardsCount}</span>
          </button>
          {categories.map((category) => (
            <button
              key={category.id}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
                selectedCategory === category.id ? "bg-gray-900 text-white" : "bg-gray-50 text-gray-700"
              }`}
              onClick={() => setSelectedCategory(category.id)}
            >
              <span className="flex min-w-0 items-center gap-2">
                <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: category.color }} />
                <span className="truncate">{category.title}</span>
              </span>
              <span>{category.cards_count ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-700">Новая категория</div>
        <div className="space-y-3">
          <TextInput
            placeholder="Например, Japanese N5"
            value={categoryTitle}
            onChange={(event) => setCategoryTitle(event.target.value)}
          />
          <div className="flex gap-2">
            {colors.map((color) => (
              <button
                key={color}
                aria-label={`Цвет ${color}`}
                className={`h-8 w-8 rounded-full border-2 ${
                  categoryColor === color ? "border-gray-900" : "border-white"
                }`}
                style={{ background: color }}
                onClick={() => setCategoryColor(color)}
              />
            ))}
          </div>
          <Button
            color="dark"
            className="w-full bg-ink text-white enabled:hover:bg-gray-800"
            disabled={!categoryTitle.trim()}
            isProcessing={addCategory.isPending}
            onClick={() => addCategory.mutate()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        </div>
      </div>
    </aside>
  );
}
