"use client";

import { ReviewDeck } from "@/components/review/review-deck";
import type { Card, Category } from "@/lib/types";
import { REVIEW_INTERVALS } from "@/lib/types";
import { Select } from "flowbite-react";
import { useState } from "react";

export function ReviewPageContent({
  authFetch,
  cards,
  categories,
  isLoading,
  onReviewed,
  selectedCategory,
  setSelectedCategory
}: {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  cards: Card[];
  categories: Category[];
  isLoading: boolean;
  onReviewed: () => void;
  selectedCategory: string;
  setSelectedCategory: (categoryId: string) => void;
}) {
  const [interval, setInterval] = useState(60);

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-4 grid gap-3 md:grid-cols-[1fr_220px_180px] md:items-end">
        <div>
          <h1 className="text-xl font-semibold text-ink">Режим повторения</h1>
          <p className="text-sm text-gray-500">Влево: отложить в конец колоды. Вправо: применить интервал.</p>
        </div>
        <Select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
          <option value="all">Все категории</option>
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
      </div>

      <ReviewDeck
        authFetch={authFetch}
        cards={cards}
        interval={interval}
        isLoading={isLoading}
        onReviewed={onReviewed}
        setInterval={setInterval}
      />
    </div>
  );
}
