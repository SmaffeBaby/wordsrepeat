import type { ComponentType, SVGProps } from "react";

export type CategoryIconName =
  | "archive"
  | "book"
  | "code"
  | "folder"
  | "heart"
  | "image"
  | "language"
  | "lightning"
  | "star"
  | "tag";

type IconComponent = ComponentType<SVGProps<SVGSVGElement>>;

export const CATEGORY_ICON_OPTIONS: { label: string; name: CategoryIconName }[] = [
  { label: "Tag", name: "tag" },
  { label: "Folder", name: "folder" },
  { label: "Book", name: "book" },
  { label: "Code", name: "code" },
  { label: "Language", name: "language" },
  { label: "Image", name: "image" },
  { label: "Archive", name: "archive" },
  { label: "Star", name: "star" },
  { label: "Lightning", name: "lightning" },
  { label: "Heart", name: "heart" }
];

const icons: Record<CategoryIconName, IconComponent> = {
  archive: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 7h16" />
      <path d="M5 7l1 13h12l1-13" />
      <path d="M8 4h8l1 3H7l1-3Z" />
      <path d="M10 11h4" />
    </svg>
  ),
  book: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v18H6.5A2.5 2.5 0 0 1 4 18.5Z" />
      <path d="M4 18.5A2.5 2.5 0 0 1 6.5 16H20" />
    </svg>
  ),
  code: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m8 9-4 3 4 3" />
      <path d="m16 9 4 3-4 3" />
      <path d="m14 5-4 14" />
    </svg>
  ),
  folder: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M3 6.5A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5v9A2.5 2.5 0 0 1 18.5 20h-13A2.5 2.5 0 0 1 3 17.5Z" />
    </svg>
  ),
  heart: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M20.8 5.6a5.3 5.3 0 0 0-7.5 0L12 6.9l-1.3-1.3a5.3 5.3 0 1 0-7.5 7.5L12 22l8.8-8.9a5.3 5.3 0 0 0 0-7.5Z" />
    </svg>
  ),
  image: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <rect x="3" y="5" width="18" height="14" rx="2" />
      <path d="m7 15 3-3 3 3 2-2 4 4" />
      <circle cx="8.5" cy="9.5" r="1.5" />
    </svg>
  ),
  language: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 5h9" />
      <path d="M9 3v2c0 4-2 7-5 9" />
      <path d="M5 9c1.5 2.5 3.5 4 6 5" />
      <path d="M13 21l4-9 4 9" />
      <path d="M14.5 18h5" />
    </svg>
  ),
  lightning: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m13 2-8 12h7l-1 8 8-12h-7l1-8Z" />
    </svg>
  ),
  star: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6.1L12 16.9 6.6 19.8l1-6.1-4.4-4.3 6.1-.9L12 3Z" />
    </svg>
  ),
  tag: (props) => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...props}>
      <path d="M4 12V5h7l9 9-7 7-9-9Z" />
      <circle cx="8.5" cy="8.5" r="1.5" />
    </svg>
  )
};

export function CategoryIcon({
  backgroundColor,
  customSvg,
  iconColor,
  iconName,
  size = "md"
}: {
  backgroundColor: string;
  customSvg?: string | null;
  iconColor: string;
  iconName: string;
  size?: "sm" | "md";
}) {
  const Icon = icons[(iconName as CategoryIconName) in icons ? (iconName as CategoryIconName) : "tag"];
  const wrapperSize = size === "sm" ? "h-7 w-7" : "h-9 w-9";
  const iconSize = size === "sm" ? "h-4 w-4" : "h-5 w-5";

  return (
    <span className={`grid shrink-0 place-items-center rounded-lg ${wrapperSize}`} style={{ backgroundColor }}>
      {customSvg ? (
        <span
          className={iconSize}
          style={{ color: iconColor }}
          dangerouslySetInnerHTML={{ __html: sanitizeSvg(customSvg) }}
        />
      ) : (
        <Icon className={iconSize} style={{ color: iconColor }} />
      )}
    </span>
  );
}

function sanitizeSvg(svg: string) {
  return svg
    .replace(/<script[\s\S]*?>[\s\S]*?<\/script>/gi, "")
    .replace(/\son\w+="[^"]*"/gi, "")
    .replace(/\son\w+='[^']*'/gi, "")
    .replace(/<svg/i, '<svg width="100%" height="100%"');
}
