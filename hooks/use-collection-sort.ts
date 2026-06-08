"use client";

import type { Card } from "@/lib/types";
import { useMemo, useState } from "react";

export type SortField = "due_at" | "created_at" | "updated_at" | "title" | "interval_minutes";
export type SortDirection = "asc" | "desc";

export type CollectionSortState = {
  direction: SortDirection;
  field: SortField;
};

const initialSort: CollectionSortState = {
  direction: "asc",
  field: "due_at"
};

export function useCollectionSort(cards: Card[]) {
  const [sort, setSort] = useState<CollectionSortState>(initialSort);

  const sortedCards = useMemo(() => {
    return [...cards].sort((first, second) => {
      const firstValue = getSortValue(first, sort.field);
      const secondValue = getSortValue(second, sort.field);
      const result =
        typeof firstValue === "string" && typeof secondValue === "string"
          ? firstValue.localeCompare(secondValue, "ru")
          : Number(firstValue) - Number(secondValue);

      return sort.direction === "asc" ? result : -result;
    });
  }, [cards, sort]);

  function updateSort<Key extends keyof CollectionSortState>(key: Key, value: CollectionSortState[Key]) {
    setSort((current) => ({ ...current, [key]: value }));
  }

  function resetSort() {
    setSort(initialSort);
  }

  return {
    resetSort,
    sort,
    sortedCards,
    updateSort
  };
}

function getSortValue(card: Card, field: SortField) {
  if (field === "title") return card.title.toLowerCase();
  if (field === "interval_minutes") return card.interval_minutes;
  return new Date(card[field]).getTime();
}
