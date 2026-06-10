export type Category = {
  id: string;
  user_id: string;
  parent_id: string | null;
  title: string;
  color: string;
  background_color: string;
  icon_color: string;
  icon_name: string;
  custom_icon_svg: string | null;
  kind: "category" | "folder";
  created_at: string;
  updated_at: string;
  cards_count?: number;
};

export type Card = {
  id: string;
  user_id: string;
  category_id: string;
  title: string;
  value: string;
  hint: string | null;
  image_url: string | null;
  answer_image_url: string | null;
  interval_minutes: number;
  due_at: string;
  deck_position: number;
  created_at: string;
  updated_at: string;
  categories?: Pick<Category, "id" | "title" | "color" | "background_color" | "icon_color" | "icon_name" | "custom_icon_svg">;
};

export const REVIEW_INTERVALS = [
  { label: "5 мин", minutes: 5 },
  { label: "10 мин", minutes: 10 },
  { label: "20 мин", minutes: 20 },
  { label: "1 час", minutes: 60 },
  { label: "3 часа", minutes: 180 },
  { label: "6 часов", minutes: 360 },
  { label: "12 часов", minutes: 720 },
  { label: "1 день", minutes: 1440 },
  { label: "3 дня", minutes: 4320 },
  { label: "1 неделя", minutes: 10080 }
];
