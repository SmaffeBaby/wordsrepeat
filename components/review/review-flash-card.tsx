"use client";

import type { Card } from "@/lib/types";
import { Badge, Button } from "flowbite-react";
import { Eye, EyeOff, Sparkles } from "lucide-react";
import type { PointerEvent } from "react";

export function ReviewFlashCard({
  card,
  count,
  dragOffset = 0,
  exiting = null,
  index,
  isPreview = false,
  onPointerDown,
  onPointerMove,
  onPointerUp,
  setShowHint,
  setShowValue,
  showHint = false,
  showValue = false
}: {
  card: Card;
  count: number;
  dragOffset?: number;
  exiting?: "again" | "done" | null;
  index: number;
  isPreview?: boolean;
  onPointerDown?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerMove?: (event: PointerEvent<HTMLDivElement>) => void;
  onPointerUp?: () => void;
  setShowHint?: (value: (current: boolean) => boolean) => void;
  setShowValue?: (value: (current: boolean) => boolean) => void;
  showHint?: boolean;
  showValue?: boolean;
}) {
  const rotation = Math.max(-11, Math.min(11, dragOffset / 28));
  const transform = isPreview
    ? "translateY(18px) scale(0.96)"
    : `translateX(${dragOffset}px) rotate(${rotation}deg)`;
  const opacity = isPreview ? 0.74 : 1;

  return (
    <div
      className={`absolute inset-4 rounded-lg border border-gray-200 bg-white p-5 shadow-sm transition-all duration-300 sm:inset-6 ${
        isPreview ? "pointer-events-none" : "touch-pan-y cursor-grab active:cursor-grabbing"
      } ${exiting ? "duration-300 ease-out" : ""}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      style={{ opacity, transform, zIndex: isPreview ? 1 : 2 }}
    >
      {!isPreview && Math.abs(dragOffset) > 40 ? (
        <div
          className={`absolute top-6 rounded-lg border-2 px-4 py-2 text-lg font-bold uppercase ${
            dragOffset > 0 ? "right-6 border-emerald-500 text-emerald-600" : "left-6 border-red-500 text-red-600"
          }`}
        >
          {dragOffset > 0 ? "Принять" : "Отложить"}
        </div>
      ) : null}

      <div className="mb-4 flex items-center justify-between gap-3">
        <Badge style={{ backgroundColor: card.categories?.color ?? "#2f8f6b" }}>
          {card.categories?.title ?? "Категория"}
        </Badge>
        <span className="text-sm text-gray-500">{index} / {count}</span>
      </div>

      <h2 className="break-words text-3xl font-semibold text-ink">{card.title}</h2>

      {card.image_url ? (
        <div className="relative mt-5 h-44 overflow-hidden rounded-lg bg-gray-200 sm:h-52">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={card.image_url} alt="" className="h-full w-full object-cover" />
        </div>
      ) : null}

      <div className="mt-5 rounded-lg bg-gray-50 p-4 text-lg leading-8 text-gray-800">
        <p className={showValue || isPreview ? "" : "card-value-blur"}>{card.value}</p>
      </div>

      {!isPreview && showHint && card.hint ? (
        <div className="mt-4 rounded-lg border border-amber/40 bg-amber/10 p-3 text-sm text-gray-700">
          {card.hint}
        </div>
      ) : null}

      {!isPreview ? (
        <div className="mt-5 flex flex-wrap justify-center gap-3">
          <Button color="light" onClick={() => setShowHint?.((value) => !value)} disabled={!card.hint}>
            <Sparkles className="mr-2 h-4 w-4" />
            Подсказка
          </Button>
          <Button color="light" onClick={() => setShowValue?.((value) => !value)}>
            {showValue ? <EyeOff className="mr-2 h-4 w-4" /> : <Eye className="mr-2 h-4 w-4" />}
            {showValue ? "Скрыть" : "Показать"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
