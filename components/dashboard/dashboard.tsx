"use client";

import { CardComposer } from "@/components/cards/card-composer";
import { CategoryCsvTools } from "@/components/cards/category-csv-tools";
import { Collection } from "@/components/cards/collection";
import { CollectionFilter } from "@/components/cards/collection-filter";
import { CollectionPagination } from "@/components/cards/collection-pagination";
import { CollectionSort } from "@/components/cards/collection-sort";
import type { DashboardPage } from "@/components/client-app";
import { CategorySidebar } from "@/components/dashboard/category-sidebar";
import { ReviewPageContent } from "@/components/review/review-page-content";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useCollectionFilter } from "@/hooks/use-collection-filter";
import { useCollectionPagination } from "@/hooks/use-collection-pagination";
import { useCollectionSort } from "@/hooks/use-collection-sort";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";
import { Badge, Button } from "flowbite-react";
import { BookOpen, LogOut } from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

export function Dashboard({ page, session }: { page: DashboardPage; session: Session }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [isSidebarWide, setIsSidebarWide] = useState(false);
  const authFetch = useAuthFetch(session);
  const { allDueCardsQuery, cardsQuery, categoriesQuery, dueCardsQuery, invalidateCards } = useDashboardData(
    selectedCategory,
    authFetch
  );
  const cards = useMemo(() => cardsQuery.data ?? [], [cardsQuery.data]);
  const { filteredCards, filters, resetFilters, updateFilter } = useCollectionFilter(cards);
  const { resetSort, sort, sortedCards, updateSort } = useCollectionSort(filteredCards);
  const {
    page: collectionPage,
    pageSize,
    paginatedCards,
    setPage: setCollectionPage,
    setPageSize,
    totalPages
  } = useCollectionPagination(sortedCards);
  const [selectedCardIds, setSelectedCardIds] = useState<Set<string>>(new Set());
  const [isDeletingSelected, setIsDeletingSelected] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const visibleCardIds = useMemo(() => paginatedCards.map((card) => card.id), [paginatedCards]);
  const allVisibleSelected = visibleCardIds.length > 0 && visibleCardIds.every((id) => selectedCardIds.has(id));

  useEffect(() => {
    const existingCardIds = new Set(cards.map((card) => card.id));
    setSelectedCardIds((current) => new Set([...current].filter((id) => existingCardIds.has(id))));
  }, [cards]);

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

  async function deleteSelectedCards() {
    const ids = [...selectedCardIds];
    if (ids.length === 0) return;
    const confirmed = window.confirm(`Удалить выбранные карточки (${ids.length})?`);
    if (!confirmed) return;

    setIsDeletingSelected(true);
    setBulkError(null);
    try {
      await Promise.all(
        ids.map((id) =>
          authFetch<{ ok: boolean }>("/api/cards", {
            method: "DELETE",
            body: JSON.stringify({ id })
          })
        )
      );
      setSelectedCardIds(new Set());
      invalidateCards();
    } catch (error) {
      setBulkError(error instanceof Error ? error.message : "Не удалось удалить выбранные карточки");
    } finally {
      setIsDeletingSelected(false);
    }
  }

  return (
    <main className="min-h-screen bg-mist">
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4">
          <div className="flex min-w-0 items-center gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-ink text-white">
              <BookOpen className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-lg font-semibold text-ink">WordsRepeat</p>
              <p className="truncate text-sm text-gray-500">{session.user.email}</p>
            </div>
          </div>

            <Button
              aria-label="Выйти"
              className="h-11 w-11 shrink-0 p-0"
              color="light"
              onClick={() => supabaseBrowser.auth.signOut()}
            >
              <LogOut className="h-5 w-5" />
            </Button>

        </div>
      </header>

      <div
        className={`mx-auto grid max-w-7xl gap-6 px-4 py-6 transition-[grid-template-columns] ${
          isSidebarWide ? "lg:grid-cols-[420px_1fr]" : "lg:grid-cols-[280px_1fr]"
        }`}
      >
        <CategorySidebar
          authFetch={authFetch}
          categories={categoriesQuery.data ?? []}
          cardsCount={cardsQuery.data?.length ?? 0}
          isWide={isSidebarWide}
          onCategoryChanged={invalidateCards}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
          setWide={setIsSidebarWide}
        />

        <section className="min-w-0 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="inline-flex rounded-lg bg-white p-1 shadow-sm">
              <Link
                className={`rounded-md px-4 py-2 text-sm font-semibold ${
                  page === "review" ? "bg-ink text-white" : "text-gray-600"
                }`}
                href="/review"
              >
                Повторение
              </Link>
              <Link
                className={`rounded-md px-4 py-2 text-sm font-semibold ${
                  page === "collection" ? "bg-ink text-white" : "text-gray-600"
                }`}
                href="/"
              >
                Коллекция
              </Link>
            </div>
            <Badge color="success" size="sm">
              К повторению: {allDueCardsQuery.data?.length ?? 0}
            </Badge>
          </div>

          {page === "review" ? (
            <ReviewPageContent
              authFetch={authFetch}
              cards={dueCardsQuery.data ?? []}
              categories={categoriesQuery.data ?? []}
              isLoading={dueCardsQuery.isLoading}
              onReviewed={invalidateCards}
              selectedCategory={selectedCategory}
              setSelectedCategory={setSelectedCategory}
            />
          ) : (
            <>
              <CardComposer
                authFetch={authFetch}
                categories={categoriesQuery.data ?? []}
                onSaved={invalidateCards}
                selectedCategory={selectedCategory}
              />
              <CategoryCsvTools
                authFetch={authFetch}
                cards={cards}
                categories={categoriesQuery.data ?? []}
                onImported={invalidateCards}
                selectedCategory={selectedCategory}
              />
              <CollectionFilter
                filteredCount={filteredCards.length}
                filters={filters}
                onReset={resetFilters}
                onUpdate={updateFilter}
                totalCount={cards.length}
              />
              <CollectionSort
                allVisibleSelected={allVisibleSelected}
                deleting={isDeletingSelected}
                onDeleteSelected={deleteSelectedCards}
                onReset={resetSort}
                onSelectVisible={toggleVisibleCards}
                onUpdate={updateSort}
                selectedCount={selectedCardIds.size}
                sort={sort}
                visibleCount={visibleCardIds.length}
              />
              {bulkError ? <p className="text-sm text-red-600">{bulkError}</p> : null}
              <CollectionPagination
                page={collectionPage}
                pageSize={pageSize}
                setPage={setCollectionPage}
                setPageSize={setPageSize}
                totalCount={sortedCards.length}
                totalPages={totalPages}
              />
              <Collection
                authFetch={authFetch}
                cards={paginatedCards}
                categories={categoriesQuery.data ?? []}
                emptyMessage={cards.length === 0 ? "В коллекции пока нет карточек." : "По фильтру ничего не найдено."}
                isLoading={cardsQuery.isLoading}
                onUpdated={invalidateCards}
                onToggleSelected={toggleSelectedCard}
                selectedCardIds={selectedCardIds}
              />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
