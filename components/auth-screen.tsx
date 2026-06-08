"use client";

import { supabaseBrowser } from "@/lib/supabase-browser";
import { Button, Label, TextInput } from "flowbite-react";
import { BookOpen, Sparkles } from "lucide-react";
import { useState } from "react";

export function AuthScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  async function submit() {
    setIsLoading(true);
    setError(null);
    const action =
      mode === "signin"
        ? supabaseBrowser.auth.signInWithPassword({ email, password })
        : supabaseBrowser.auth.signUp({ email, password });

    const { error: authError } = await action;
    setIsLoading(false);
    if (authError) setError(authError.message);
  }

  return (
    <main className="min-h-screen bg-mist px-4 py-8">
      <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[1fr_420px]">
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-medium text-fern shadow-sm">
            <Sparkles className="h-4 w-4" />
            WordsRepeat
          </div>
          <div className="max-w-2xl space-y-4">
            <h1 className="text-4xl font-semibold tracking-normal text-ink sm:text-6xl">
              Карточки, коллекции и повторение без лишнего шума
            </h1>
            <p className="text-lg leading-8 text-gray-600">
              Локальная Supabase хранит данные и изображения, Redis ускоряет чтение, а режим
              повторения работает как живая колода.
            </p>
          </div>
        </div>

        <div className="rounded-lg bg-white p-6 shadow-lift">
          <div className="mb-6 grid grid-cols-2 rounded-lg bg-gray-100 p-1">
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                mode === "signin" ? "bg-white text-ink shadow-sm" : "text-gray-500"
              }`}
              onClick={() => setMode("signin")}
            >
              Вход
            </button>
            <button
              className={`rounded-md px-4 py-2 text-sm font-semibold ${
                mode === "signup" ? "bg-white text-ink shadow-sm" : "text-gray-500"
              }`}
              onClick={() => setMode("signup")}
            >
              Регистрация
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="email" value="Email" />
              <TextInput id="email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
            <div>
              <Label htmlFor="password" value="Пароль" />
              <TextInput
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error ? <p className="text-sm text-red-600">{error}</p> : null}
            <Button
              className="w-full bg-ink text-white enabled:hover:bg-gray-800"
              color="dark"
              isProcessing={isLoading}
              onClick={submit}
            >
              <BookOpen className="mr-2 h-4 w-4" />
              {mode === "signin" ? "Войти" : "Создать аккаунт"}
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
