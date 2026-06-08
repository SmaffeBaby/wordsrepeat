"use client";

import type { Card, Category } from "@/lib/types";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export function useDashboardData(
  selectedCategory: string,
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>
) {
  const queryClient = useQueryClient();
  const categoryParam = selectedCategory === "all" ? "" : `categoryId=${selectedCategory}`;

  const categoriesQuery = useQuery({
    queryKey: ["categories"],
    queryFn: () => authFetch<Category[]>("/api/categories")
  });

  const cardsQuery = useQuery({
    queryKey: ["cards", selectedCategory],
    queryFn: () => authFetch<Card[]>(categoryParam ? `/api/cards?${categoryParam}` : "/api/cards")
  });

  const dueCardsQuery = useQuery({
    queryKey: ["cards", "due", selectedCategory],
    queryFn: () => authFetch<Card[]>(categoryParam ? `/api/cards?due=1&${categoryParam}` : "/api/cards?due=1"),
    refetchInterval: 20_000
  });

  const allDueCardsQuery = useQuery({
    queryKey: ["cards", "due", "all-count"],
    queryFn: () => authFetch<Card[]>("/api/cards?due=1"),
    refetchInterval: 20_000
  });

  function invalidateCards() {
    queryClient.invalidateQueries({ queryKey: ["cards"] });
    queryClient.invalidateQueries({ queryKey: ["categories"] });
  }

  return {
    allDueCardsQuery,
    cardsQuery,
    categoriesQuery,
    dueCardsQuery,
    invalidateCards
  };
}
