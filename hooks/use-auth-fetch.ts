"use client";

import type { Session } from "@supabase/supabase-js";
import { useMemo } from "react";

export function useAuthFetch(session: Session) {
  return useMemo(() => {
    return async <T,>(url: string, options: RequestInit = {}) => {
      const isFormData = options.body instanceof FormData;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...(isFormData ? {} : { "Content-Type": "application/json" }),
          Authorization: `Bearer ${session.access_token}`,
          ...options.headers
        }
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error ?? "Request failed");
      return payload as T;
    };
  }, [session.access_token]);
}
