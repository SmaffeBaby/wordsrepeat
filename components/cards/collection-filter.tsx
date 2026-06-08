"use client";

import type { CollectionFilters } from "@/hooks/use-collection-filter";
import { REVIEW_INTERVALS } from "@/lib/types";
import { Button, Select, TextInput } from "flowbite-react";
import { Filter, RotateCcw, Search } from "lucide-react";

export function CollectionFilter({
  filters,
  filteredCount,
  totalCount,
  onReset,
  onUpdate
}: {
  filters: CollectionFilters;
  filteredCount: number;
  totalCount: number;
  onReset: () => void;
  onUpdate: <Key extends keyof CollectionFilters>(key: Key, value: CollectionFilters[Key]) => void;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <Filter className="h-4 w-4" />
          Фильтр
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Показано {filteredCount} из {totalCount}
          </span>
          <Button aria-label="Сбросить фильтр" className="h-9 w-9 p-0" color="light" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-[1.4fr_1fr_1fr_1fr_1fr]">
        <TextInput
          icon={Search}
          placeholder="Название, ответ, подсказка"
          value={filters.query}
          onChange={(event) => onUpdate("query", event.target.value)}
        />
        <Select
          value={filters.due}
          onChange={(event) => onUpdate("due", event.target.value as CollectionFilters["due"])}
        >
          <option value="all">Любое время</option>
          <option value="due">Пора повторять</option>
          <option value="hour">В течение часа</option>
          <option value="day">В течение дня</option>
          <option value="week">В течение недели</option>
          <option value="later">Позже недели</option>
        </Select>
        <Select
          value={filters.interval}
          onChange={(event) =>
            onUpdate("interval", event.target.value === "all" ? "all" : Number(event.target.value))
          }
        >
          <option value="all">Любой интервал</option>
          {REVIEW_INTERVALS.map((item) => (
            <option key={item.minutes} value={item.minutes}>
              {item.label}
            </option>
          ))}
        </Select>
        <Select
          value={filters.hint}
          onChange={(event) => onUpdate("hint", event.target.value as CollectionFilters["hint"])}
        >
          <option value="all">Любые подсказки</option>
          <option value="with">С подсказкой</option>
          <option value="without">Без подсказки</option>
        </Select>
        <Select
          value={filters.image}
          onChange={(event) => onUpdate("image", event.target.value as CollectionFilters["image"])}
        >
          <option value="all">Любые изображения</option>
          <option value="any">Есть изображение</option>
          <option value="front">Есть лицевая</option>
          <option value="answer">Есть ответ</option>
          <option value="none">Без изображений</option>
        </Select>
      </div>
    </div>
  );
}
