"use client";

import { QueryProvider } from "@/components/query-provider";
import { AuthScreen } from "@/components/auth-screen";
import { Dashboard } from "@/components/dashboard/dashboard";
import { supabaseBrowser } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";
import { Spinner } from "flowbite-react";
import { useEffect, useState } from "react";

export type DashboardPage = "collection" | "review";

function AppShell({ page }: { page: DashboardPage }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);

  useEffect(() => {
    supabaseBrowser.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingSession(false);
    });

    const { data } = supabaseBrowser.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => data.subscription.unsubscribe();
  }, []);

  if (loadingSession) {
    return (
      <main className="grid min-h-screen place-items-center bg-mist">
        <Spinner size="xl" />
      </main>
    );
  }

  return session ? <Dashboard page={page} session={session} /> : <AuthScreen />;
}

export function ClientApp({ page = "collection" }: { page?: DashboardPage }) {
  return (
    <QueryProvider>
      <AppShell page={page} />
    </QueryProvider>
  );
}
