import { createBrowserClient } from "@supabase/ssr";

/** Browser/client Supabase — anon key only. Never use service role here. */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
