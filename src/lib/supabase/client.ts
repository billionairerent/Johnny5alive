import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { DemoSupabaseClient, isDemoMode } from "./demo";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let demoClient: any = null;

export function createClient() {
  if (isDemoMode()) {
    if (!demoClient) demoClient = new DemoSupabaseClient();
    return demoClient;
  }
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
