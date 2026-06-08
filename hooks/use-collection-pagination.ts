"use client";

import type { Card } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

export const PAGE_SIZE_OPTIONS = [5, 10, 15, 30] as const;

export function useCollectionPagination(cards: Card[]) {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState<(typeof PAGE_SIZE_OPTIONS)[number]>(10);
  const totalPages = Math.max(1, Math.ceil(cards.length / pageSize));

  useEffect(() => {
    setPage((current) => Math.min(current, totalPages));
  }, [totalPages]);

  useEffect(() => {
    setPage(1);
  }, [cards, pageSize]);

  const paginatedCards = useMemo(() => {
    const startIndex = (page - 1) * pageSize;
    return cards.slice(startIndex, startIndex + pageSize);
  }, [cards, page, pageSize]);

  return {
    page,
    pageSize,
    paginatedCards,
    setPage,
    setPageSize,
    totalPages
  };
}
