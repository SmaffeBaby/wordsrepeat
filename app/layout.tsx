import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WordsRepeat",
  description: "Локальный тренажер интервального повторения"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>{children}</body>
    </html>
  );
}
