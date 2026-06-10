"use client";

import { CATEGORY_ICON_OPTIONS, CategoryIcon } from "@/lib/category-icons";
import type { Category } from "@/lib/types";
import { useMutation } from "@tanstack/react-query";
import { Button, FileInput, Label, Select, TextInput } from "flowbite-react";
import {
  ChevronDown,
  ChevronRight,
  FolderTree,
  GripVertical,
  PanelLeftClose,
  PanelLeftOpen,
  Pencil,
  Plus,
  Save,
  Trash2,
  X
} from "lucide-react";
import { useMemo, useState } from "react";

type CategoryNode = Category & {
  children: CategoryNode[];
  treeCount: number;
};

const defaultBackgroundColor = "#eaf7f1";
const defaultIconColor = "#2f8f6b";

export function CategorySidebar({
  authFetch,
  cardsCount,
  categories,
  isWide,
  onCategoryChanged,
  selectedCategory,
  setWide,
  setSelectedCategory
}: {
  authFetch: <T>(url: string, options?: RequestInit) => Promise<T>;
  cardsCount: number;
  categories: Category[];
  isWide: boolean;
  onCategoryChanged: () => void;
  selectedCategory: string;
  setWide: (isWide: boolean) => void;
  setSelectedCategory: (categoryId: string) => void;
}) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<Category["kind"]>("category");
  const [parentId, setParentId] = useState("");
  const [backgroundColor, setBackgroundColor] = useState(defaultBackgroundColor);
  const [iconColor, setIconColor] = useState(defaultIconColor);
  const [iconName, setIconName] = useState("tag");
  const [customIconSvg, setCustomIconSvg] = useState<string | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());
  const [draggedCategoryId, setDraggedCategoryId] = useState<string | null>(null);
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [editKind, setEditKind] = useState<Category["kind"]>("category");
  const [editParentId, setEditParentId] = useState("");
  const [editBackgroundColor, setEditBackgroundColor] = useState(defaultBackgroundColor);
  const [editIconColor, setEditIconColor] = useState(defaultIconColor);
  const [editIconName, setEditIconName] = useState("tag");
  const [editCustomIconSvg, setEditCustomIconSvg] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [svgError, setSvgError] = useState<string | null>(null);
  const [editSvgError, setEditSvgError] = useState<string | null>(null);
  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);
  const folderOptions = useMemo(() => categories.filter((category) => category.kind === "folder"), [categories]);
  const editingNode = useMemo(() => findCategoryNode(categoryTree, editingCategoryId), [categoryTree, editingCategoryId]);
  const editFolderOptions = useMemo(
    () => getEditableFolderOptions(categories, editingNode),
    [categories, editingNode]
  );

  const addCategory = useMutation({
    mutationFn: () =>
      authFetch<Category>("/api/categories", {
        method: "POST",
        body: JSON.stringify({
          background_color: backgroundColor,
          color: iconColor,
          custom_icon_svg: customIconSvg,
          icon_color: iconColor,
          icon_name: customIconSvg ? "custom" : iconName,
          kind,
          parent_id: parentId || null,
          title
        })
      }),
    onSuccess: (category) => {
      setTitle("");
      setCustomIconSvg(null);
      setSvgError(null);
      if (category.kind === "category") setSelectedCategory(category.id);
      if (category.parent_id) setExpandedFolders((current) => new Set(current).add(category.parent_id as string));
      onCategoryChanged();
    }
  });

  const moveCategory = useMutation({
    mutationFn: ({ id, parentId }: { id: string; parentId: string | null }) =>
      authFetch<Category>("/api/categories", {
        method: "PATCH",
        body: JSON.stringify({
          id,
          parent_id: parentId
        })
      }),
    onSuccess: (category) => {
      setActionError(null);
      if (category.parent_id) setExpandedFolders((current) => new Set(current).add(category.parent_id as string));
      onCategoryChanged();
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Не удалось перенести категорию");
    },
    onSettled: () => {
      setDraggedCategoryId(null);
    }
  });

  const updateCategory = useMutation({
    mutationFn: () =>
      authFetch<Category>("/api/categories", {
        method: "PATCH",
        body: JSON.stringify({
          background_color: editBackgroundColor,
          color: editIconColor,
          custom_icon_svg: editCustomIconSvg,
          icon_color: editIconColor,
          icon_name: editCustomIconSvg ? "custom" : editIconName,
          id: editingCategoryId,
          kind: editKind,
          parent_id: editParentId || null,
          title: editTitle
        })
      }),
    onSuccess: (category) => {
      setActionError(null);
      if (category.parent_id) setExpandedFolders((current) => new Set(current).add(category.parent_id as string));
      setEditingCategoryId(null);
      setEditSvgError(null);
      onCategoryChanged();
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Не удалось обновить категорию");
    }
  });

  const deleteCategory = useMutation({
    mutationFn: (id: string) =>
      authFetch<{ ok: boolean }>("/api/categories", {
        method: "DELETE",
        body: JSON.stringify({ id })
      }),
    onSuccess: () => {
      setActionError(null);
      onCategoryChanged();
    },
    onError: (error) => {
      setActionError(error instanceof Error ? error.message : "Не удалось удалить категорию");
    }
  });

  function toggleFolder(folderId: string) {
    setExpandedFolders((current) => {
      const next = new Set(current);
      if (next.has(folderId)) next.delete(folderId);
      else next.add(folderId);
      return next;
    });
  }

  async function handleSvgUpload(file: File | null) {
    setSvgError(null);
    if (!file) return;
    if (file.size > 10 * 1024) {
      setSvgError("SVG должен быть до 10 КБ");
      return;
    }
    const svg = await file.text();
    if (!svg.includes("<svg")) {
      setSvgError("Загрузите SVG-файл");
      return;
    }
    setCustomIconSvg(svg);
  }

  async function handleEditSvgUpload(file: File | null) {
    setEditSvgError(null);
    if (!file) return;
    if (file.size > 10 * 1024) {
      setEditSvgError("SVG должен быть до 10 КБ");
      return;
    }
    const svg = await file.text();
    if (!svg.includes("<svg")) {
      setEditSvgError("Загрузите SVG-файл");
      return;
    }
    setEditCustomIconSvg(svg);
  }

  function startEditingCategory(node: CategoryNode) {
    setEditingCategoryId(node.id);
    setEditTitle(node.title);
    setEditKind(node.kind);
    setEditParentId(node.parent_id ?? "");
    setEditBackgroundColor(node.background_color ?? defaultBackgroundColor);
    setEditIconColor(node.icon_color ?? node.color ?? defaultIconColor);
    setEditIconName(node.icon_name ?? (node.kind === "folder" ? "folder" : "tag"));
    setEditCustomIconSvg(node.custom_icon_svg ?? null);
    setEditSvgError(null);
    setActionError(null);
  }

  function moveDraggedCategory(parentId: string | null) {
    if (!draggedCategoryId) return;
    const draggedCategory = categories.find((category) => category.id === draggedCategoryId);
    if (!draggedCategory || draggedCategory.parent_id === parentId) {
      setDraggedCategoryId(null);
      return;
    }
    moveCategory.mutate({ id: draggedCategoryId, parentId });
  }

  function confirmDeleteCategory(node: CategoryNode) {
    const itemIds = collectCategoryIds(node);
    const itemLabel = node.kind === "folder" ? "папку" : "категорию";
    const confirmed = window.confirm(
      `Удалить ${itemLabel} "${node.title}"? Будут удалены вложенные элементы и карточки (${node.treeCount}).`
    );
    if (!confirmed) return;
    if (itemIds.includes(selectedCategory)) setSelectedCategory("all");
    deleteCategory.mutate(node.id);
  }

  return (
    <aside className="space-y-4">
      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3 text-sm font-semibold text-gray-700">
          <div className="flex min-w-0 items-center gap-2">
            <FolderTree className="h-4 w-4 shrink-0" />
            <span>Категории</span>
          </div>
          <button
            aria-label={isWide ? "Свернуть блок категорий" : "Расширить блок категорий"}
            className="grid h-8 w-8 shrink-0 place-items-center rounded-md text-gray-500 hover:bg-gray-100 hover:text-gray-700"
            onClick={() => setWide(!isWide)}
            type="button"
          >
            {isWide ? <PanelLeftClose className="h-4 w-4" /> : <PanelLeftOpen className="h-4 w-4" />}
          </button>
        </div>
        <div className="space-y-2">
          <button
            className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-left text-sm ${
              selectedCategory === "all"
                ? "bg-gray-900 text-white"
                : draggedCategoryId
                  ? "border border-dashed border-emerald-300 bg-emerald-50 text-gray-700"
                  : "bg-gray-50 text-gray-700"
            }`}
            onDragOver={(event) => {
              if (!draggedCategoryId) return;
              event.preventDefault();
            }}
            onDrop={(event) => {
              event.preventDefault();
              moveDraggedCategory(null);
            }}
            onClick={() => setSelectedCategory("all")}
          >
            Все карточки
            <span>{cardsCount}</span>
          </button>
          {actionError ? <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{actionError}</p> : null}
          {categoryTree.map((node) => (
            <CategoryTreeItem
              key={node.id}
              draggedCategoryId={draggedCategoryId}
              expandedFolders={expandedFolders}
              isDeleting={deleteCategory.isPending}
              isMoving={moveCategory.isPending}
              node={node}
              onDelete={confirmDeleteCategory}
              onDragStart={setDraggedCategoryId}
              onDropIntoFolder={moveDraggedCategory}
              onEdit={startEditingCategory}
              onSelect={setSelectedCategory}
              onToggleFolder={toggleFolder}
              selectedCategory={selectedCategory}
            />
          ))}
        </div>
      </div>

      {editingNode ? (
        <div className="rounded-lg bg-white p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div className="text-sm font-semibold text-gray-700">Редактирование</div>
            <button
              aria-label="Закрыть редактирование"
              className="grid h-8 w-8 place-items-center rounded-md text-gray-500 hover:bg-gray-100"
              onClick={() => setEditingCategoryId(null)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          <div className="space-y-3">
            <TextInput value={editTitle} onChange={(event) => setEditTitle(event.target.value)} />
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <Select value={editKind} onChange={(event) => setEditKind(event.target.value as Category["kind"])}>
                <option value="category">Категория</option>
                <option value="folder">Папка</option>
              </Select>
              <Select value={editParentId} onChange={(event) => setEditParentId(event.target.value)}>
                <option value="">Без родителя</option>
                {editFolderOptions.map((category) => (
                  <option key={category.id} value={category.id}>
                    Папка · {category.title}
                  </option>
                ))}
              </Select>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              <div>
                <Label htmlFor="edit-category-bg-color" value="Цвет фона" />
                <input
                  id="edit-category-bg-color"
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white p-1"
                  type="color"
                  value={editBackgroundColor}
                  onChange={(event) => setEditBackgroundColor(event.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="edit-category-icon-color" value="Цвет иконки" />
                <input
                  id="edit-category-icon-color"
                  className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white p-1"
                  type="color"
                  value={editIconColor}
                  onChange={(event) => setEditIconColor(event.target.value)}
                />
              </div>
            </div>
            <Select value={editIconName} onChange={(event) => setEditIconName(event.target.value)}>
              {CATEGORY_ICON_OPTIONS.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.label}
                </option>
              ))}
            </Select>
            <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
              <CategoryIcon
                backgroundColor={editBackgroundColor}
                customSvg={editCustomIconSvg}
                iconColor={editIconColor}
                iconName={editCustomIconSvg ? "tag" : editIconName}
              />
              <span className="min-w-0 truncate text-sm text-gray-600">{editCustomIconSvg ? "Кастомный SVG" : "Предпросмотр"}</span>
              {editCustomIconSvg ? (
                <Button className="ml-auto h-8 px-3" color="light" onClick={() => setEditCustomIconSvg(null)}>
                  Убрать
                </Button>
              ) : null}
            </div>
            <div>
              <Label htmlFor="edit-custom-category-svg" value="Свой SVG до 10 КБ" />
              <FileInput
                id="edit-custom-category-svg"
                accept=".svg,image/svg+xml"
                onChange={(event) => handleEditSvgUpload(event.target.files?.[0] ?? null)}
              />
              {editSvgError ? <p className="mt-2 text-sm text-red-600">{editSvgError}</p> : null}
            </div>
            <Button
              color="dark"
              className="w-full bg-ink text-white enabled:hover:bg-gray-800"
              disabled={!editTitle.trim() || Boolean(editSvgError) || !editingCategoryId}
              isProcessing={updateCategory.isPending}
              onClick={() => updateCategory.mutate()}
            >
              <Save className="mr-2 h-4 w-4" />
              Сохранить
            </Button>
          </div>
        </div>
      ) : null}

      <div className="rounded-lg bg-white p-4 shadow-sm">
        <div className="mb-3 text-sm font-semibold text-gray-700">Новая папка или категория</div>
        <div className="space-y-3">
          <TextInput placeholder="Например, English words" value={title} onChange={(event) => setTitle(event.target.value)} />
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <Select value={kind} onChange={(event) => setKind(event.target.value as Category["kind"])}>
              <option value="category">Категория</option>
              <option value="folder">Папка</option>
            </Select>
            <Select value={parentId} onChange={(event) => setParentId(event.target.value)}>
              <option value="">Без родителя</option>
              {folderOptions.map((category) => (
                <option key={category.id} value={category.id}>
                  Папка · {category.title}
                </option>
              ))}
            </Select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <div>
              <Label htmlFor="category-bg-color" value="Цвет фона" />
              <input
                id="category-bg-color"
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white p-1"
                type="color"
                value={backgroundColor}
                onChange={(event) => setBackgroundColor(event.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="category-icon-color" value="Цвет иконки" />
              <input
                id="category-icon-color"
                className="mt-1 h-10 w-full rounded-lg border border-gray-300 bg-white p-1"
                type="color"
                value={iconColor}
                onChange={(event) => setIconColor(event.target.value)}
              />
            </div>
          </div>
          <Select value={iconName} onChange={(event) => setIconName(event.target.value)}>
            {CATEGORY_ICON_OPTIONS.map((option) => (
              <option key={option.name} value={option.name}>
                {option.label}
              </option>
            ))}
          </Select>
          <div className="flex items-center gap-3 rounded-lg bg-gray-50 p-3">
            <CategoryIcon
              backgroundColor={backgroundColor}
              customSvg={customIconSvg}
              iconColor={iconColor}
              iconName={customIconSvg ? "tag" : iconName}
            />
            <span className="min-w-0 truncate text-sm text-gray-600">{customIconSvg ? "Кастомный SVG" : "Предпросмотр"}</span>
            {customIconSvg ? (
              <Button className="ml-auto h-8 px-3" color="light" onClick={() => setCustomIconSvg(null)}>
                Убрать
              </Button>
            ) : null}
          </div>
          <div>
            <Label htmlFor="custom-category-svg" value="Свой SVG до 10 КБ" />
            <FileInput id="custom-category-svg" accept=".svg,image/svg+xml" onChange={(event) => handleSvgUpload(event.target.files?.[0] ?? null)} />
            {svgError ? <p className="mt-2 text-sm text-red-600">{svgError}</p> : null}
          </div>
          <Button
            color="dark"
            className="w-full bg-ink text-white enabled:hover:bg-gray-800"
            disabled={!title.trim() || Boolean(svgError)}
            isProcessing={addCategory.isPending}
            onClick={() => addCategory.mutate()}
          >
            <Plus className="mr-2 h-4 w-4" />
            Добавить
          </Button>
        </div>
      </div>
    </aside>
  );
}

function CategoryTreeItem({
  draggedCategoryId,
  expandedFolders,
  isDeleting,
  isMoving,
  level = 0,
  node,
  onDelete,
  onDragStart,
  onDropIntoFolder,
  onEdit,
  onSelect,
  onToggleFolder,
  selectedCategory
}: {
  draggedCategoryId: string | null;
  expandedFolders: Set<string>;
  isDeleting: boolean;
  isMoving: boolean;
  level?: number;
  node: CategoryNode;
  onDelete: (node: CategoryNode) => void;
  onDragStart: (categoryId: string) => void;
  onDropIntoFolder: (folderId: string) => void;
  onEdit: (node: CategoryNode) => void;
  onSelect: (categoryId: string) => void;
  onToggleFolder: (folderId: string) => void;
  selectedCategory: string;
}) {
  const isFolder = node.kind === "folder";
  const isExpanded = expandedFolders.has(node.id);
  const hasChildren = node.children.length > 0;
  const isDragged = draggedCategoryId === node.id;
  const isDropTarget = isFolder && draggedCategoryId && draggedCategoryId !== node.id && !containsCategory(node, draggedCategoryId);

  return (
    <div className="space-y-1">
      <div
        className={`flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm ${
          selectedCategory === node.id
            ? "bg-gray-900 text-white"
            : isDropTarget
              ? "border border-dashed border-emerald-300 bg-emerald-50 text-gray-700"
              : "bg-gray-50 text-gray-700"
        }`}
        draggable={!isMoving && !isDeleting}
        onDragEnd={() => onDragStart("")}
        onDragOver={(event) => {
          if (!isDropTarget) return;
          event.preventDefault();
        }}
        onDragStart={(event) => {
          event.dataTransfer.effectAllowed = "move";
          onDragStart(node.id);
        }}
        onDrop={(event) => {
          if (!isDropTarget) return;
          event.preventDefault();
          onDropIntoFolder(node.id);
        }}
        style={{ opacity: isDragged ? 0.55 : 1, paddingLeft: `${12 + level * 14}px` }}
      >
        <button
          aria-label={`Перенести ${node.title}`}
          className={`grid h-6 w-6 shrink-0 place-items-center rounded-md ${
            selectedCategory === node.id ? "text-white/70 hover:bg-white/10" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          }`}
          type="button"
        >
          <GripVertical className="h-4 w-4" />
        </button>
        <button
          className="flex min-w-0 flex-1 items-start gap-2 text-left"
          onClick={() => {
            if (isFolder) onToggleFolder(node.id);
            onSelect(node.id);
          }}
          type="button"
        >
          {isFolder ? (
            <span className="mt-1 shrink-0">
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronRight className="h-3.5 w-3.5" />}
            </span>
          ) : (
            <span className="mt-1 w-3.5 shrink-0" />
          )}
          <CategoryIcon
            backgroundColor={node.background_color}
            customSvg={node.custom_icon_svg}
            iconColor={node.icon_color}
            iconName={node.icon_name}
            size="sm"
          />
          <span className="min-w-0 whitespace-normal break-words leading-5">{node.title}</span>
        </button>
        <span className="mt-1 shrink-0">{node.treeCount}</span>
        <button
          aria-label={`Редактировать ${node.title}`}
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
            selectedCategory === node.id ? "text-white/80 hover:bg-white/10" : "text-gray-400 hover:bg-gray-100 hover:text-gray-600"
          }`}
          onClick={(event) => {
            event.stopPropagation();
            onEdit(node);
          }}
          type="button"
        >
          <Pencil className="h-4 w-4" />
        </button>
        <button
          aria-label={`Удалить ${node.title}`}
          className={`grid h-7 w-7 shrink-0 place-items-center rounded-md ${
            selectedCategory === node.id ? "text-white/80 hover:bg-white/10" : "text-gray-400 hover:bg-red-50 hover:text-red-600"
          }`}
          disabled={isDeleting}
          onClick={(event) => {
            event.stopPropagation();
            onDelete(node);
          }}
          type="button"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {isFolder && isExpanded && hasChildren
        ? node.children.map((child) => (
            <CategoryTreeItem
              key={child.id}
              draggedCategoryId={draggedCategoryId}
              expandedFolders={expandedFolders}
              isDeleting={isDeleting}
              isMoving={isMoving}
              level={level + 1}
              node={child}
              onDelete={onDelete}
              onDragStart={onDragStart}
              onDropIntoFolder={onDropIntoFolder}
              onEdit={onEdit}
              onSelect={onSelect}
              onToggleFolder={onToggleFolder}
              selectedCategory={selectedCategory}
            />
          ))
        : null}
    </div>
  );
}

function buildCategoryTree(categories: Category[]) {
  const nodes = new Map<string, CategoryNode>();
  const roots: CategoryNode[] = [];

  categories.forEach((category) => {
    nodes.set(category.id, {
      ...category,
      background_color: category.background_color ?? defaultBackgroundColor,
      children: [],
      custom_icon_svg: category.custom_icon_svg ?? null,
      icon_color: category.icon_color ?? category.color,
      icon_name: category.icon_name ?? (category.kind === "folder" ? "folder" : "tag"),
      kind: category.kind ?? "category",
      parent_id: category.parent_id ?? null,
      treeCount: category.cards_count ?? 0
    });
  });

  nodes.forEach((node) => {
    const parent = node.parent_id ? nodes.get(node.parent_id) : null;
    if (parent) parent.children.push(node);
    else roots.push(node);
  });

  const sortNodes = (items: CategoryNode[]) => {
    items.sort((first, second) => {
      if (first.kind !== second.kind) return first.kind === "folder" ? -1 : 1;
      return first.title.localeCompare(second.title, "ru");
    });
    items.forEach((item) => sortNodes(item.children));
  };

  const computeCounts = (node: CategoryNode): number => {
    node.treeCount = (node.cards_count ?? 0) + node.children.reduce((total, child) => total + computeCounts(child), 0);
    return node.treeCount;
  };

  roots.forEach(computeCounts);
  sortNodes(roots);
  return roots;
}

function findCategoryNode(nodes: CategoryNode[], categoryId: string | null): CategoryNode | undefined {
  if (!categoryId) return undefined;
  for (const node of nodes) {
    if (node.id === categoryId) return node;
    const child = findCategoryNode(node.children, categoryId);
    if (child) return child;
  }
  return undefined;
}

function getEditableFolderOptions(categories: Category[], editingNode?: CategoryNode) {
  if (!editingNode) return categories.filter((category) => category.kind === "folder");
  const blockedIds = new Set(collectCategoryIds(editingNode));
  return categories.filter((category) => category.kind === "folder" && !blockedIds.has(category.id));
}

function collectCategoryIds(node?: CategoryNode): string[] {
  if (!node) return [];
  return [node.id, ...node.children.flatMap((child) => collectCategoryIds(child))];
}

function containsCategory(node: CategoryNode, categoryId: string): boolean {
  return node.children.some((child) => child.id === categoryId || containsCategory(child, categoryId));
}
