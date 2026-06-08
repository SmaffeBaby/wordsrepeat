"use client";

import { PAGE_SIZE_OPTIONS } from "@/hooks/use-collection-pagination";
import { Button, Select } from "flowbite-react";
import { ChevronLeft, ChevronRight, ListFilter } from "lucide-react";

export function CollectionPagination({
  page,
  pageSize,
  setPage,
  setPageSize,
  totalCount,
  totalPages
}: {
  page: number;
  pageSize: (typeof PAGE_SIZE_OPTIONS)[number];
  setPage: (page: number) => void;
  setPageSize: (pageSize: (typeof PAGE_SIZE_OPTIONS)[number]) => void;
  totalCount: number;
  totalPages: number;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-white p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-semibold text-gray-700">
        <ListFilter className="h-4 w-4" />
        Пагинация
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm text-gray-500">
          Страница {page} из {totalPages} · карточек: {totalCount}
        </span>
        <Select
          className="w-32"
          value={pageSize}
          onChange={(event) => setPageSize(Number(event.target.value) as (typeof PAGE_SIZE_OPTIONS)[number])}
        >
          {PAGE_SIZE_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option} на странице
            </option>
          ))}
        </Select>
        <div className="flex items-center gap-2">
          <Button aria-label="Предыдущая страница" className="h-9 w-9 p-0" color="light" disabled={page <= 1} onClick={() => setPage(page - 1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            aria-label="Следующая страница"
            className="h-9 w-9 p-0"
            color="light"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
