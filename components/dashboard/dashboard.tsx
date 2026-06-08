"use client";

import { CardComposer } from "@/components/cards/card-composer";
import { Collection } from "@/components/cards/collection";
import type { DashboardPage } from "@/components/client-app";
import { CategorySidebar } from "@/components/dashboard/category-sidebar";
import { ReviewPageContent } from "@/components/review/review-page-content";
import { useAuthFetch } from "@/hooks/use-auth-fetch";
import { useDashboardData } from "@/hooks/use-dashboard-data";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";
import { Badge, Button, Tooltip } from "flowbite-react";
import { BookOpen, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

export function Dashboard({ page, session }: { page: DashboardPage; session: Session }) {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const authFetch = useAuthFetch(session);
  const { allDueCardsQuery, cardsQuery, categoriesQuery, dueCardsQuery, invalidateCards } = useDashboardData(
    selectedCategory,
    authFetch
  );

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

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[280px_1fr]">
        <CategorySidebar
          authFetch={authFetch}
          categories={categoriesQuery.data ?? []}
          cardsCount={cardsQuery.data?.length ?? 0}
          onCategoryCreated={invalidateCards}
          selectedCategory={selectedCategory}
          setSelectedCategory={setSelectedCategory}
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
                onCreated={invalidateCards}
                selectedCategory={selectedCategory}
              />
              <Collection cards={cardsQuery.data ?? []} isLoading={cardsQuery.isLoading} />
            </>
          )}
        </section>
      </div>
    </main>
  );
}
