"use client";

import { Flame } from "lucide-react";

export function DifficultyFlames({
  disabled = false,
  onChange,
  value
}: {
  disabled?: boolean;
  onChange?: (value: number) => void;
  value: number;
}) {
  const normalizedValue = Math.max(1, Math.min(5, Math.round(value || 1)));

  return (
    <div className="flex items-center gap-1" aria-label={`Сложность ${normalizedValue} из 5`}>
      {[1, 2, 3, 4, 5].map((item) => {
        const active = item <= normalizedValue;
        return (
          <button
            key={item}
            aria-label={`Сложность ${item} из 5`}
            className={`grid h-7 w-7 place-items-center rounded-md ${
              onChange && !disabled ? "hover:bg-amber-50" : "cursor-default"
            }`}
            disabled={disabled || !onChange}
            onClick={() => onChange?.(item)}
            type="button"
          >
            <Flame className={`h-4 w-4 ${active ? "fill-orange-500 text-orange-500" : "text-gray-300"}`} />
          </button>
        );
      })}
    </div>
  );
}
