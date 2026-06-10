"use client";

import type { Card, Category } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { Button, FileInput, Label, Select } from "flowbite-react";
import { Download, FileSpreadsheet, Upload } from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type ImportResult = {
  inserted: number;
  skipped: number;
  errors: string[];
};

type CsvCard = {
  title: string;
  value: string;
  hint?: string | null;
  image_url?: string | null;
  answer_image_url?: string | null;
  interval_minutes?: number;
};

const importHeaders = ["title", "value", "hint", "interval_minutes", "image_url", "answer_image_url"];
const exportHeaders = [...importHeaders, "category"];

export function CategoryCsvTools({
  authFetch,
  cards,
  categories,
  onImported,
  selectedCategory
}: {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  cards: Card[];
  categories: Category[];
  onImported: () => void;
  selectedCategory: string;
}) {
  const availableCategories = useMemo(() => categories.filter((category) => category.kind === "category"), [categories]);
  const selectedImportCategory = availableCategories.find((category) => category.id === selectedCategory);
  const [categoryId, setCategoryId] = useState(selectedImportCategory?.id ?? "");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (selectedImportCategory) setCategoryId(selectedImportCategory.id);
  }, [selectedImportCategory]);

  const importCards = useMutation({
    mutationFn: (items: CsvCard[]) =>
      authFetch<ImportResult>("/api/cards/import", {
        method: "POST",
        body: JSON.stringify({
          category_id: categoryId,
          cards: items
        })
      }),
    onSuccess: (result) => {
      setError(null);
      setStatus(`Импортировано: ${result.inserted}${result.skipped ? `, пропущено: ${result.skipped}` : ""}`);
      onImported();
    },
    onError: (mutationError) => {
      setStatus(null);
      setError(mutationError instanceof Error ? mutationError.message : "Не удалось импортировать CSV");
    }
  });

  async function handleImport(file: File | null) {
    setError(null);
    setStatus(null);
    if (!file) return;

    try {
      const text = await file.text();
      const parsedCards = parseCardsCsv(text);
      if (parsedCards.length === 0) {
        setError("В CSV не найдено карточек. Нужны колонки title и value.");
        return;
      }
      importCards.mutate(parsedCards);
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : "Не удалось прочитать CSV");
    }
  }

  function exportCsv() {
    const rows = cards.map((card) => [
      card.title,
      card.value,
      card.hint ?? "",
      String(card.interval_minutes),
      card.image_url ?? "",
      card.answer_image_url ?? "",
      card.categories?.title ?? ""
    ]);
    const csv = toCsv([exportHeaders, ...rows]);
    const blob = new Blob([`\uFEFF${csv}`], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `${csvFileName(selectedCategory, categories)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="rounded-lg bg-white p-4 shadow-sm">
      <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-gray-700">
        <FileSpreadsheet className="h-4 w-4" />
        CSV импорт/экспорт
      </div>
      <div className="grid gap-4 xl:grid-cols-[1fr_auto]">
        <div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <Select value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
            <option value="" disabled>
              Категория для импорта
            </option>
            {availableCategories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.title}
              </option>
            ))}
          </Select>
          <div>
            <Label htmlFor="cards-csv-import" value="CSV: title,value,hint,interval_minutes,image_url,answer_image_url" />
            <FileInput
              id="cards-csv-import"
              accept=".csv,text/csv"
              disabled={!categoryId || importCards.isPending}
              onChange={(event) => handleImport(event.target.files?.[0] ?? null)}
            />
          </div>
        </div>
        <div className="flex items-end gap-3">
          <Button
            color="light"
            disabled={!categoryId || importCards.isPending}
            isProcessing={importCards.isPending}
            onClick={() => document.getElementById("cards-csv-import")?.click()}
          >
            <Upload className="mr-2 h-4 w-4" />
            Импорт
          </Button>
          <Button color="light" disabled={cards.length === 0} onClick={exportCsv}>
            <Download className="mr-2 h-4 w-4" />
            Экспорт CSV
          </Button>
        </div>
      </div>
      {status ? <p className="mt-3 text-sm text-emerald-700">{status}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}

function parseCardsCsv(text: string): CsvCard[] {
  const rows = parseCsvRows(text.replace(/^\uFEFF/, ""));
  if (rows.length === 0) return [];

  const firstRow = rows[0].map((cell) => normalizeHeader(cell));
  const hasHeader = importHeaders.some((header) => firstRow.includes(header));
  const headers = hasHeader ? firstRow : importHeaders;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  return dataRows
    .map((row) => {
      const valueByHeader = new Map(headers.map((header, index) => [header, row[index]?.trim() ?? ""]));
      return {
        title: valueByHeader.get("title") ?? "",
        value: valueByHeader.get("value") ?? "",
        hint: valueByHeader.get("hint") || null,
        image_url: valueByHeader.get("image_url") || null,
        answer_image_url: valueByHeader.get("answer_image_url") || null,
        interval_minutes: Number(valueByHeader.get("interval_minutes") || 60)
      };
    })
    .filter((card) => card.title || card.value);
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    const nextCharacter = text[index + 1];

    if (character === '"' && quoted && nextCharacter === '"') {
      cell += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(cell);
      cell = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && nextCharacter === "\n") index += 1;
      row.push(cell);
      rows.push(row);
      row = [];
      cell = "";
    } else {
      cell += character;
    }
  }

  row.push(cell);
  rows.push(row);
  return rows.filter((items) => items.some((item) => item.trim()));
}

function toCsv(rows: string[][]) {
  return rows.map((row) => row.map(escapeCsvCell).join(",")).join("\n");
}

function escapeCsvCell(value: string) {
  const normalized = value.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  if (!/[",\n]/.test(normalized)) return normalized;
  return `"${normalized.replace(/"/g, '""')}"`;
}

function normalizeHeader(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function csvFileName(selectedCategory: string, categories: Category[]) {
  const category = categories.find((item) => item.id === selectedCategory);
  const title = category?.title ?? (selectedCategory === "all" ? "all-cards" : "cards");
  return `wordsrepeat-${title.toLowerCase().replace(/[^a-z0-9а-яё]+/gi, "-").replace(/^-|-$/g, "")}`;
}
