import { createClient } from "@supabase/supabase-js";

function supabaseUrl() {
  return process.env.SUPABASE_INTERNAL_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
}

export function createAuthedSupabase(accessToken: string) {
  return createClient(supabaseUrl(), process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "local-anon-key-placeholder", {
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    }
  });
}

export function createServiceSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SERVICE_ROLE_KEY;

  if (!serviceKey) {
    throw new Error("Missing SUPABASE_SERVICE_ROLE_KEY");
  }

  return createClient(supabaseUrl(), serviceKey, {
    auth: {
      persistSession: false
    }
  });
}

export function getPublicStorageUrl(bucket: string, path: string) {
  const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321";
  return `${publicUrl.replace(/\/$/, "")}/storage/v1/object/public/${bucket}/${path}`;
}

export function createPublicSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL ?? "http://127.0.0.1:54321",
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "local-anon-key-placeholder",
    {
      auth: {
        persistSession: false
      }
    }
  );
}

export async function getUserFromRequest(request: Request) {
  const token = request.headers.get("authorization")?.replace("Bearer ", "");

  if (!token) {
    return { error: "Missing auth token" as const };
  }

  const supabase = createAuthedSupabase(token);
  const { data, error } = await supabase.auth.getUser(token);

  if (error || !data.user) {
    return { error: "Invalid auth token" as const };
  }

  return { supabase, user: data.user, token };
}
