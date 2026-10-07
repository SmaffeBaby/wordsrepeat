"use client";

import { CollectionFilter } from "@/components/cards/collection-filter";
import { CollectionPagination } from "@/components/cards/collection-pagination";
import { CollectionSort } from "@/components/cards/collection-sort";
import { CompletedCards } from "@/components/cards/completed-cards";
import { useCollectionFilter } from "@/hooks/use-collection-filter";
import { useCollectionPagination } from "@/hooks/use-collection-pagination";
import { useCollectionSort } from "@/hooks/use-collection-sort";
import type { Card } from "@/lib/types";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

export function CompletedPageContent({
  authFetch,
  onChanged
}: {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  onChanged: () => void;
}) {
  const completedQuery = useQuery({
    queryKey: ["cards", "completed"],
    queryFn: () => authFetch<Card[]>("/api/cards/completed"),
    refetchInterval: 60_000
  });
  const cards = useMemo(() => completedQuery.data ?? [], [completedQuery.data]);
  const { filteredCards, filters, resetFilters, updateFilter } = useCollectionFilter(cards);
  const { resetSort, sort, sortedCards, updateSort } = useCollectionSort(filteredCards);
  const {
    page,
    pageSize,
    paginatedCards,
    setPage,
    setPageSize,
    totalPages
  } = useCollectionPagination(sortedCards);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const visibleCardIds = useMemo(() => paginatedCards.map((card) => card.id), [paginatedCards]);
  const allVisibleSelected = visibleCardIds.length > 0 && visibleCardIds.every((id) => selectedCardIds.has(id));

  useEffect(() => {
    const existingCardIds = new Set(cards.map((card) => card.id));
    setSelectedCardIds((current) => new Set([...current].filter((id) => existingCardIds.has(id))));
  }, [cards]);

  const restoreCard = useMutation({
    mutationFn: (id: string) =>
      authFetch<Card>("/api/cards/completed", {
        method: "PATCH",
        body: JSON.stringify({ id })
      }),
    onSuccess: () => refreshCompleted()
  });

  const deleteCard = useMutation({
    mutationFn: (id: string) =>
      authFetch<{ ok: boolean }>("/api/cards/completed", {
        method: "DELETE",
        body: JSON.stringify({ id })
      }),
    onSuccess: () => refreshCompleted()
  });

  function refreshCompleted() {
    completedQuery.refetch();
    onChanged();
  }

  function toggleSelectedCard(cardId: string, selected: boolean) {
    setSelectedCardIds((current) => {
      const next = new Set(current);
      if (selected) next.add(cardId);
      else next.delete(cardId);
      return next;
    });
  }

  function toggleVisibleCards() {
    setSelectedCardIds((current) => {
      const next = new Set(current);
      if (allVisibleSelected) visibleCardIds.forEach((id) => next.delete(id));
      else visibleCardIds.forEach((id) => next.add(id));
      return next;
    });
  }

  function deleteOne(card: Card) {
    if (!window.confirm(`Удалить карточку "${card.title}" окончательно?`)) return;
    deleteCard.mutate(card.id);
  }

  async function deleteSelectedCards() {
    const ids = [...selectedCardIds];
    if (ids.length === 0) return;
    if (!window.confirm(`Удалить выбранные завершённые карточки (${ids.length}) окончательно?`)) return;

    await Promise.all(ids.map((id) => deleteCard.mutateAsync(id)));
    setSelectedCardIds(new Set());
  }

  return (
    <div className="space-y-6">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <h1 className="text-xl font-semibold text-ink">Завершённые</h1>
        <p className="mt-1 text-sm text-gray-500">
          Выученные карточки хранятся здесь 14 дней, после чего очищаются автоматически.
        </p>
      </div>
      <CollectionFilter
        filteredCount={filteredCards.length}
        filters={filters}
        onReset={resetFilters}
        onUpdate={updateFilter}
        totalCount={cards.length}
      />
      <CollectionSort
        allVisibleSelected={allVisibleSelected}
        deleting={deleteCard.isPending}
        onDeleteSelected={deleteSelectedCards}
        onReset={resetSort}
        onSelectVisible={toggleVisibleCards}
        onUpdate={updateSort}
        selectedCount={selectedCardIds.size}
        sort={sort}
        visibleCount={visibleCardIds.length}
      />
      <CollectionPagination
        page={page}
        pageSize={pageSize}
        setPage={setPage}
        setPageSize={setPageSize}
        totalCount={sortedCards.length}
        totalPages={totalPages}
      />
      <CompletedCards
        cards={paginatedCards}
        deleting={deleteCard.isPending}
        emptyMessage={cards.length === 0 ? "Завершённых карточек пока нет." : "По фильтру ничего не найдено."}
        isLoading={completedQuery.isLoading}
        onDelete={deleteOne}
        onRestore={(card) => restoreCard.mutate(card.id)}
        onToggleSelected={toggleSelectedCard}
        restoring={restoreCard.isPending}
        selectedCardIds={selectedCardIds}
      />
    </div>
  );
}
