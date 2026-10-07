"use client";

import { DifficultyFlames } from "@/components/cards/difficulty-flames";
import type { Card } from "@/lib/types";
import { Button, Checkbox, Spinner } from "flowbite-react";
import { RotateCcw, Trash2 } from "lucide-react";

export function CompletedCards({
  cards,
  deleting,
  emptyMessage = "Здесь появятся карточки, которые ты отметил как выученные.",
  isLoading,
  onDelete,
  onRestore,
  onToggleSelected,
  restoring,
  selectedCardIds
}: {
  cards: Card[];
  deleting: boolean;
  emptyMessage?: string;
  isLoading: boolean;
  onDelete: (card: Card) => void;
  onRestore: (card: Card) => void;
  onToggleSelected: (cardId: string, selected: boolean) => void;
  restoring: boolean;
  selectedCardIds: Set<string>;
}) {
  if (isLoading) {
    return (
      <div className="grid min-h-56 place-items-center rounded-lg bg-white shadow-sm">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {cards.map((card) => (
        <article key={card.id} className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-start gap-3">
              <label className="mt-1 shrink-0">
                <span className="sr-only">Выбрать завершённую карточку {card.title}</span>
                <Checkbox
                  checked={selectedCardIds.has(card.id)}
                  onChange={(event) => onToggleSelected(card.id, event.target.checked)}
                />
              </label>
              <div className="min-w-0">
                <h3 className="break-words text-lg font-semibold text-ink">{card.title}</h3>
                <p className="mt-1 text-xs text-gray-500">{card.categories?.title}</p>
              </div>
            </div>
            <DifficultyFlames value={card.difficulty ?? 1} />
          </div>

          <p className="line-clamp-3 text-sm leading-6 text-gray-600">{card.value}</p>
          {card.hint ? <p className="mt-3 text-sm text-gray-500">Подсказка: {card.hint}</p> : null}
          <p className="mt-3 text-xs text-gray-400">Удалится автоматически: {autoDeleteDate(card.completed_at)}</p>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button color="light" disabled={restoring || deleting} size="sm" onClick={() => onRestore(card)}>
              <RotateCcw className="mr-2 h-4 w-4" />
              Вернуть
            </Button>
            <Button color="failure" disabled={restoring || deleting} size="sm" onClick={() => onDelete(card)}>
              <Trash2 className="mr-2 h-4 w-4" />
              Удалить
            </Button>
          </div>
        </article>
      ))}

      {cards.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center text-gray-500 shadow-sm md:col-span-2 xl:col-span-3">
          {emptyMessage}
        </div>
      ) : null}
    </div>
  );
}

function autoDeleteDate(completedAt: string | null) {
  if (!completedAt) return "через 14 дней";
  return new Date(new Date(completedAt).getTime() + 14 * 24 * 60 * 60 * 1000).toLocaleDateString("ru-RU");
}
