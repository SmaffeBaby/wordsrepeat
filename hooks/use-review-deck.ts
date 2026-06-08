"use client";

import type { Card } from "@/lib/types";
import { PointerEvent, useEffect, useMemo, useState } from "react";

type ReviewResult = "again" | "done";

const SWIPE_DISTANCE = 96;

function shuffleCards(cards: Card[]) {
  const copy = [...cards];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function buildDeck(cards: Card[]) {
  const postponed = cards
    .filter((card) => card.deck_position > 0)
    .sort((left, right) => left.deck_position - right.deck_position);
  const fresh = cards.filter((card) => card.deck_position <= 0);
  return [...shuffleCards(fresh), ...postponed];
}

export function useReviewDeck(
  cards: Card[],
  reviewCard: (result: ReviewResult, card: Card) => Promise<void>,
  isReviewing: boolean
) {
  const [deck, setDeck] = useState<Card[]>([]);
  const [showValue, setShowValue] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [dragStart, setDragStart] = useState<number | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const [exiting, setExiting] = useState<ReviewResult | null>(null);

  const sourceKey = useMemo(
    () => cards.map((card) => `${card.id}:${card.due_at}:${card.deck_position}`).join("|"),
    [cards]
  );

  useEffect(() => {
    setDeck(buildDeck(cards));
  }, [sourceKey, cards]);

  const current = deck[0] ?? null;
  const next = deck[1] ?? null;

  useEffect(() => {
    setShowValue(false);
    setShowHint(false);
    setDragOffset(0);
    setDragStart(null);
  }, [current?.id]);

  async function completeSwipe(result: ReviewResult) {
    if (!current || isReviewing || exiting) return;
    setExiting(result);
    setDragOffset(result === "done" ? 460 : -460);

    window.setTimeout(async () => {
      const reviewed = current;
      setDeck((value) => {
        const [, ...rest] = value;
        return result === "again" ? [...rest, reviewed] : rest;
      });
      setExiting(null);
      setDragOffset(0);
      await reviewCard(result, reviewed);
    }, 260);
  }

  function onPointerDown(event: PointerEvent<HTMLDivElement>) {
    if (!current || isReviewing || exiting) return;
    setDragStart(event.clientX);
  }

  function onPointerMove(event: PointerEvent<HTMLDivElement>) {
    if (dragStart === null || isReviewing || exiting) return;
    setDragOffset(event.clientX - dragStart);
  }

  function onPointerUp() {
    if (dragStart === null || isReviewing || exiting) return;
    const delta = dragOffset;
    setDragStart(null);
    if (delta < -SWIPE_DISTANCE) void completeSwipe("again");
    else if (delta > SWIPE_DISTANCE) void completeSwipe("done");
    else setDragOffset(0);
  }

  return {
    completeSwipe,
    current,
    deck,
    dragOffset,
    exiting,
    next,
    onPointerDown,
    onPointerMove,
    onPointerUp,
    showHint,
    showValue,
    setShowHint,
    setShowValue
  };
}
