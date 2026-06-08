"use client";

import type { CollectionSortState } from "@/hooks/use-collection-sort";
import { Button, Select } from "flowbite-react";
import { ArrowDownAZ, CheckSquare, RotateCcw, Trash2 } from "lucide-react";

export function CollectionSort({
  allVisibleSelected,
  deleting,
  onDeleteSelected,
  onReset,
  onSelectVisible,
  onUpdate,
  selectedCount,
  sort,
  visibleCount
}: {
  allVisibleSelected: boolean;
  deleting: boolean;
  onDeleteSelected: () => void;
  onReset: () => void;
  onSelectVisible: () => void;
  onUpdate: <Key extends keyof CollectionSortState>(key: Key, value: CollectionSortState[Key]) => void;
  selectedCount: number;
  sort: CollectionSortState;
  visibleCount: number;
}) {
  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
          <ArrowDownAZ className="h-4 w-4" />
          Сортировка
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm text-gray-500">Выбрано: {selectedCount}</span>
          <Button color="light" disabled={visibleCount === 0} onClick={onSelectVisible}>
            <CheckSquare className="mr-2 h-4 w-4" />
            {allVisibleSelected ? "Снять выбор" : "Выбрать страницу"}
          </Button>
          <Button
            color="failure"
            disabled={selectedCount === 0 || deleting}
            isProcessing={deleting}
            onClick={onDeleteSelected}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Удалить выбранные
          </Button>
          <Button aria-label="Сбросить сортировку" className="h-9 w-9 p-0" color="light" onClick={onReset}>
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Select
          value={sort.field}
          onChange={(event) => onUpdate("field", event.target.value as CollectionSortState["field"])}
        >
          <option value="due_at">По времени повторения</option>
          <option value="created_at">По дате создания</option>
          <option value="updated_at">По последнему изменению</option>
          <option value="title">По названию</option>
          <option value="interval_minutes">По интервалу</option>
        </Select>
        <Select
          value={sort.direction}
          onChange={(event) => onUpdate("direction", event.target.value as CollectionSortState["direction"])}
        >
          <option value="asc">По возрастанию</option>
          <option value="desc">По убыванию</option>
        </Select>
      </div>
    </div>
  );
}
