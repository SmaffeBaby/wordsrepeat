"use client";

import type { Card } from "@/lib/types";
import { useMemo, useState } from "react";

export type DueFilter = "all" | "due" | "hour" | "day" | "week" | "later";
export type HintFilter = "all" | "with" | "without";
export type ImageFilter = "all" | "any" | "front" | "answer" | "none";

export type CollectionFilters = {
  due: DueFilter;
  hint: HintFilter;
  image: ImageFilter;
  interval: number | "all";
  query: string;
};

const initialFilters: CollectionFilters = {
  due: "all",
  hint: "all",
  image: "all",
  interval: "all",
  query: ""
};

export function useCollectionFilter(cards: Card[]) {
  const [filters, setFilters] = useState<CollectionFilters>(initialFilters);

  const filteredCards = useMemo(() => {
    const normalizedQuery = filters.query.trim().toLowerCase();
    const now = Date.now();

    return cards.filter((card) => {
      if (normalizedQuery) {
        const searchableText = [card.title, card.value, card.hint ?? "", card.categories?.title ?? ""]
          .join(" ")
          .toLowerCase();
        if (!searchableText.includes(normalizedQuery)) return false;
      }

      if (filters.interval !== "all" && card.interval_minutes !== filters.interval) return false;

      const dueTime = new Date(card.due_at).getTime();
      const msUntilDue = dueTime - now;
      const isDue = msUntilDue <= 0;
      if (filters.due === "due" && !isDue) return false;
      if (filters.due === "hour" && (isDue || msUntilDue > 60 * 60 * 1000)) return false;
      if (filters.due === "day" && (isDue || msUntilDue > 24 * 60 * 60 * 1000)) return false;
      if (filters.due === "week" && (isDue || msUntilDue > 7 * 24 * 60 * 60 * 1000)) return false;
      if (filters.due === "later" && (isDue || msUntilDue <= 7 * 24 * 60 * 60 * 1000)) return false;

      const hasHint = Boolean(card.hint?.trim());
      if (filters.hint === "with" && !hasHint) return false;
      if (filters.hint === "without" && hasHint) return false;

      const hasFrontImage = Boolean(card.image_url);
      const hasAnswerImage = Boolean(card.answer_image_url);
      if (filters.image === "any" && !hasFrontImage && !hasAnswerImage) return false;
      if (filters.image === "front" && !hasFrontImage) return false;
      if (filters.image === "answer" && !hasAnswerImage) return false;
      if (filters.image === "none" && (hasFrontImage || hasAnswerImage)) return false;

      return true;
    });
  }, [cards, filters]);

  function updateFilter<Key extends keyof CollectionFilters>(key: Key, value: CollectionFilters[Key]) {
    setFilters((current) => ({ ...current, [key]: value }));
  }

  function resetFilters() {
    setFilters(initialFilters);
  }

  return {
    filteredCards,
    filters,
    resetFilters,
    updateFilter
  };
}
