"use client";

import { CardComposer } from "@/components/cards/card-composer";
import type { Card, Category } from "@/lib/types";
import { REVIEW_INTERVALS } from "@/lib/types";
import { Badge, Button, Checkbox, Spinner } from "flowbite-react";
import { Clock3, Image as ImageIcon, Pencil } from "lucide-react";
import { useState } from "react";
import Countdown from "react-countdown";

export function Collection({
  authFetch,
  cards,
  categories,
  emptyMessage = "В коллекции пока нет карточек.",
  isLoading,
  onToggleSelected,
  onUpdated,
  selectedCardIds
}: {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  cards: Card[];
  categories: Category[];
  emptyMessage?: string;
  isLoading: boolean;
  onToggleSelected: (cardId: string, selected: boolean) => void;
  onUpdated: () => void;
  selectedCardIds: Set<string>;
}) {
  const [editingCardId, setEditingCardId] = useState<string | null>(null);

  if (isLoading) {
    return (
      <div className="grid min-h-56 place-items-center rounded-lg bg-white shadow-sm">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) =>
        editingCardId === card.id ? (
          <div key={card.id} className="md:col-span-2 xl:col-span-3">
            <CardComposer
              authFetch={authFetch}
              categories={categories}
              editingCard={card}
              onCancel={() => setEditingCardId(null)}
              onDeleted={() => {
                setEditingCardId(null);
                onUpdated();
              }}
              onSaved={() => {
                setEditingCardId(null);
                onUpdated();
              }}
              selectedCategory="all"
            />
          </div>
        ) : (
          <article key={card.id} className="overflow-hidden rounded-lg bg-white shadow-sm">
            {card.image_url ? (
              <div className="relative h-40 bg-gray-200">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.image_url} alt="" className="h-full w-full object-cover" />
              </div>
            ) : null}
            <div className="space-y-3 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex min-w-0 items-start gap-3">
                  <label className="mt-1 shrink-0">
                    <span className="sr-only">Выбрать карточку {card.title}</span>
                    <Checkbox
                      checked={selectedCardIds.has(card.id)}
                      onChange={(event) => onToggleSelected(card.id, event.target.checked)}
                    />
                  </label>
                  <h3 className="min-w-0 break-words text-lg font-semibold text-ink">{card.title}</h3>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <Badge color="gray">
                    {REVIEW_INTERVALS.find((item) => item.minutes === card.interval_minutes)?.label}
                  </Badge>
                  <Button
                    aria-label="Редактировать карточку"
                    className="h-8 w-8 p-0"
                    color="light"
                    onClick={() => setEditingCardId(card.id)}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <p className="line-clamp-3 text-sm leading-6 text-gray-600">{card.value}</p>
              {card.answer_image_url ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <ImageIcon className="h-4 w-4" />
                  Есть скрытое изображение-ответ
                </div>
              ) : null}
              {card.hint ? <p className="text-sm text-gray-500">Подсказка: {card.hint}</p> : null}
              <div className="flex items-center justify-between gap-3 text-xs text-gray-400">
                <span className="truncate">{card.categories?.title}</span>
                <CardDueCountdown dueAt={card.due_at} />
              </div>
            </div>
          </article>
        )
      )}
      {cards.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm md:col-span-2 xl:col-span-3">
          {emptyMessage}
        </div>
      ) : null}
    </div>
  );
}

function CardDueCountdown({ dueAt }: { dueAt: string }) {
  return (
    <span className="flex shrink-0 items-center gap-1">
      <Clock3 className="h-3.5 w-3.5" />
      <Countdown
        date={new Date(dueAt)}
        renderer={({ completed, days, hours, minutes, seconds }) => {
          if (completed) return <span className="font-semibold text-emerald-600">Пора повторять</span>;

          const parts = [
            days > 0 ? `${days} д` : null,
            hours > 0 ? `${hours} ч` : null,
            minutes > 0 ? `${minutes} мин` : null,
            days === 0 && hours === 0 && minutes === 0 ? `${seconds} сек` : null
          ].filter(Boolean);

          return <span>Осталось: {parts.join(" ")}</span>;
        }}
      />
    </span>
  );
}
