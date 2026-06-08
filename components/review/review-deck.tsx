"use client";

import { useReviewDeck } from "@/hooks/use-review-deck";
import type { Card } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { Button, Spinner } from "flowbite-react";
import { ArrowLeft, ArrowRight, Clock3 } from "lucide-react";
import { useEffect } from "react";
import { ReviewFlashCard } from "./review-flash-card";

export function ReviewDeck({
  authFetch,
  cards,
  interval,
  isLoading,
  onReviewed,
  setInterval
}: {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  cards: Card[];
  interval: number;
  isLoading: boolean;
  onReviewed: () => void;
  setInterval: (interval: number) => void;
}) {
  const review = useMutation({
    mutationFn: ({ result, card }: { result: "again" | "done"; card: Card }) =>
      authFetch<Card>("/api/review", {
        method: "POST",
        body: JSON.stringify({
          cardId: card.id,
          result,
          intervalMinutes: interval
        })
      }),
    onSuccess: onReviewed
  });

  const deck = useReviewDeck(
    cards,
    (result, card) => review.mutateAsync({ result, card }).then(() => undefined),
    review.isPending
  );
  const currentInterval = deck.current?.interval_minutes;

  useEffect(() => {
    if (currentInterval) setInterval(currentInterval);
  }, [currentInterval, setInterval]);

  if (isLoading) {
    return (
      <div className="grid min-h-[520px] place-items-center rounded-lg bg-gray-50">
        <Spinner size="xl" />
      </div>
    );
  }

  if (!deck.current) {
    return (
      <div className="grid min-h-[520px] place-items-center rounded-lg bg-gray-50 p-8 text-center">
        <div className="max-w-sm space-y-2">
          <Clock3 className="mx-auto h-10 w-10 text-fern" />
          <h2 className="text-xl font-semibold text-ink">Колода чистая</h2>
          <p className="text-gray-500">Создай карточки или возвращайся, когда подойдет срок повторения.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="relative mx-auto h-[560px] max-w-3xl overflow-hidden rounded-lg bg-gray-50 p-4 sm:p-6">
        {deck.next ? <ReviewFlashCard card={deck.next} count={deck.deck.length} index={2} isPreview /> : null}
        <ReviewFlashCard
          card={deck.current}
          count={deck.deck.length}
          dragOffset={deck.dragOffset}
          exiting={deck.exiting}
          index={1}
          onPointerDown={deck.onPointerDown}
          onPointerMove={deck.onPointerMove}
          onPointerUp={deck.onPointerUp}
          setShowHint={deck.setShowHint}
          setShowValue={deck.setShowValue}
          showHint={deck.showHint}
          showValue={deck.showValue}
        />
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Button
          color="failure"
          className="bg-red-600 text-white enabled:hover:bg-red-700"
          size="lg"
          disabled={review.isPending || Boolean(deck.exiting)}
          isProcessing={review.isPending && deck.exiting === "again"}
          onClick={() => deck.completeSwipe("again")}
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          повторить
        </Button>
        <Button
          color="success"
          className="bg-emerald-600 text-white enabled:hover:bg-emerald-700"
          size="lg"
          disabled={review.isPending || Boolean(deck.exiting)}
          isProcessing={review.isPending && deck.exiting === "done"}
          onClick={() => deck.completeSwipe("done")}
        >
          далее
          <ArrowRight className="ml-2 h-5 w-5" />
        </Button>
      </div>
    </>
  );
}
