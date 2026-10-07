"use client";

import { ReviewDeck } from "@/components/review/review-deck";
import type { Card, Category } from "@/lib/types";
import { Select } from "flowbite-react";

export function ReviewPageContent({
  authFetch,
  cards,
  categories,
  isLoading,
  onReviewed,
  progress,
  selectedCategory,
  setSelectedCategory
}: {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  cards: Card[];
  categories: Category[];
  isLoading: boolean;
  onReviewed: () => void;
  progress: { reviewed: number; total: number };
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_240px] md:items-end">
        <div>
          <h1 className="text-xl font-semibold text-ink">Режим повторения</h1>
          <p className="text-sm text-gray-500">Влево: отложить. Вправо: применить режим внутри карточки.</p>
        </div>
        <Select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
          <option value="all">Все категории</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.title}
            </option>
          ))}
        </Select>
      </div>

      <ReviewDeck
        authFetch={authFetch}
        cards={cards}
        isLoading={isLoading}
        onReviewed={onReviewed}
        progress={progress}
      />
    </div>
  );
}
