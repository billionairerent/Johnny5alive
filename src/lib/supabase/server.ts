import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import type { Database } from "@/types/database";

const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@autoapplyai.com",
  user_metadata: { full_name: "Demo User" },
};

function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === "https://your-project.supabase.co"
  );
}

// Minimal server-side demo client for SSR pages
function createDemoServerClient() {
  return {
    auth: {
      async getUser() {
        return { data: { user: DEMO_USER }, error: null };
      },
      async exchangeCodeForSession(_code: string) {
        return { error: null };
      },
    },
    from(_table: string) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return {
        select(_cols?: string, opts?: { count?: string; head?: boolean }) {
          return {
            eq(_col: string, _val: unknown) { return this; },
            order(_col: string, _opts?: unknown) { return this; },
            single() { return Promise.resolve({ data: null, error: null }); },
            then(resolve: (v: unknown) => void) {
              if (opts?.head) resolve({ data: null, error: null, count: 0 });
              else resolve({ data: [], error: null });
            },
          };
        },
        insert(data: unknown) {
          return {
            select() {
              return {
                single() { return Promise.resolve({ data, error: null }); },
              };
            },
            then(resolve: (v: unknown) => void) { resolve({ data, error: null }); },
          };
        },
        update(_data: unknown) {
          return {
            eq() { return Promise.resolve({ data: null, error: null }); },
          };
        },
        delete() {
          return {
            eq() { return Promise.resolve({ data: null, error: null }); },
          };
        },
      };
    },
    storage: {
      from(_bucket: string) {
        return {
          async upload(_path: string, _file: unknown) {
            return { data: { path: _path }, error: null };
          },
        };
      },
    },
  };
}

export async function createClient() {
  if (isDemoMode()) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return createDemoServerClient() as any;
  }

  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll can be called from Server Components where cookies
            // cannot be set — this is safe to ignore during read operations.
          }
        },
      },
    }
  );
}
