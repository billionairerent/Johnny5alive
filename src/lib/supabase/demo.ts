// Demo mode — runs entirely in localStorage when Supabase is not configured.
// This lets the app function without any backend for testing/demo purposes.

const DEMO_USER = {
  id: "demo-user-001",
  email: "demo@autoapplyai.com",
  user_metadata: { full_name: "Demo User" },
};

function getStore<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(`aai_${key}`);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function setStore<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`aai_${key}`, JSON.stringify(value));
}

function uuid() {
  return crypto.randomUUID();
}

function now() {
  return new Date().toISOString();
}

// Minimal query builder that mimics the Supabase JS client API surface
// used by this app. Not a full implementation — just enough for demo mode.
type Row = Record<string, unknown>;

class DemoQueryBuilder {
  private table: string;
  private op: "select" | "insert" | "update" | "delete" = "select";
  private filters: Array<{ col: string; val: unknown }> = [];
  private insertData: Row | Row[] | null = null;
  private updateData: Row | null = null;
  private orderCol: string | null = null;
  private orderAsc = true;
  private selectCols: string = "*";
  private countOnly = false;
  private headOnly = false;
  private singleRow = false;

  constructor(table: string) {
    this.table = table;
  }

  select(cols?: string, opts?: { count?: string; head?: boolean }) {
    this.op = "select";
    this.selectCols = cols || "*";
    if (opts?.count) this.countOnly = true;
    if (opts?.head) this.headOnly = true;
    return this;
  }

  insert(data: Row | Row[]) {
    this.op = "insert";
    this.insertData = data;
    return this;
  }

  update(data: Row) {
    this.op = "update";
    this.updateData = data;
    return this;
  }

  delete() {
    this.op = "delete";
    return this;
  }

  eq(col: string, val: unknown) {
    this.filters.push({ col, val });
    return this;
  }

  order(col: string, opts?: { ascending?: boolean }) {
    this.orderCol = col;
    this.orderAsc = opts?.ascending ?? true;
    return this;
  }

  single() {
    this.singleRow = true;
    return this;
  }

  private rows(): Row[] {
    return getStore<Row[]>(`table_${this.table}`, []);
  }

  private save(rows: Row[]) {
    setStore(`table_${this.table}`, rows);
  }

  private match(row: Row): boolean {
    return this.filters.every((f) => row[f.col] === f.val);
  }

  async then(
    resolve: (val: { data: unknown; error: null; count?: number }) => void
  ) {
    switch (this.op) {
      case "select": {
        let rows = this.rows().filter((r) => this.match(r));
        if (this.orderCol) {
          const col = this.orderCol;
          const asc = this.orderAsc;
          rows.sort((a, b) => {
            const av = String(a[col] ?? "");
            const bv = String(b[col] ?? "");
            return asc ? av.localeCompare(bv) : bv.localeCompare(av);
          });
        }
        if (this.countOnly || this.headOnly) {
          resolve({ data: null, error: null, count: rows.length });
        } else if (this.singleRow) {
          resolve({ data: rows[0] ?? null, error: null });
        } else {
          resolve({ data: rows, error: null });
        }
        break;
      }
      case "insert": {
        const all = this.rows();
        const items = Array.isArray(this.insertData)
          ? this.insertData
          : [this.insertData];
        const created = items.map((item) => ({
          id: uuid(),
          created_at: now(),
          updated_at: now(),
          ...item,
        }));
        all.push(...created);
        this.save(all);
        resolve({
          data: created.length === 1 ? created[0] : created,
          error: null,
        });
        break;
      }
      case "update": {
        const allRows = this.rows();
        const updated: Row[] = [];
        for (const row of allRows) {
          if (this.match(row)) {
            Object.assign(row, this.updateData, { updated_at: now() });
            updated.push(row);
          }
        }
        this.save(allRows);
        resolve({ data: updated, error: null });
        break;
      }
      case "delete": {
        const before = this.rows();
        const after = before.filter((r) => !this.match(r));
        this.save(after);
        resolve({ data: null, error: null });
        break;
      }
    }
  }
}

class DemoStorageBucket {
  private bucket: string;

  constructor(bucket: string) {
    this.bucket = bucket;
  }

  async upload(path: string, _file: File, _opts?: unknown) {
    const files = getStore<string[]>(`storage_${this.bucket}`, []);
    files.push(path);
    setStore(`storage_${this.bucket}`, files);
    return { data: { path }, error: null };
  }
}

class DemoStorage {
  from(bucket: string) {
    return new DemoStorageBucket(bucket);
  }
}

class DemoAuth {
  async getUser() {
    const loggedIn = getStore("demo_logged_in", false);
    if (!loggedIn) return { data: { user: null }, error: null };
    return { data: { user: DEMO_USER }, error: null };
  }

  async signUp(opts: { email: string; password: string; options?: { data?: { full_name?: string } } }) {
    setStore("demo_logged_in", true);
    const profile = {
      id: DEMO_USER.id,
      email: opts.email,
      full_name: opts.options?.data?.full_name ?? "",
      phone: "",
      location: "",
      linkedin_url: "",
      portfolio_url: "",
      headline: "",
      created_at: now(),
      updated_at: now(),
    };
    const profiles = getStore<Row[]>("table_profiles", []);
    if (!profiles.find((p) => p.id === DEMO_USER.id)) {
      profiles.push(profile);
      setStore("table_profiles", profiles);
    }
    return { data: { user: DEMO_USER }, error: null };
  }

  async signInWithPassword(_opts: { email: string; password: string }) {
    setStore("demo_logged_in", true);
    // Ensure profile exists
    const profiles = getStore<Row[]>("table_profiles", []);
    if (!profiles.find((p) => p.id === DEMO_USER.id)) {
      profiles.push({
        id: DEMO_USER.id,
        email: _opts.email,
        full_name: "Demo User",
        phone: "",
        location: "",
        linkedin_url: "",
        portfolio_url: "",
        headline: "",
        created_at: now(),
        updated_at: now(),
      });
      setStore("table_profiles", profiles);
    }
    return { data: { user: DEMO_USER }, error: null };
  }

  async signOut() {
    setStore("demo_logged_in", false);
    return { error: null };
  }

  async exchangeCodeForSession(_code: string) {
    return { error: null };
  }
}

export class DemoSupabaseClient {
  auth = new DemoAuth();
  storage = new DemoStorage();

  from(table: string) {
    return new DemoQueryBuilder(table);
  }
}

export function isDemoMode(): boolean {
  return (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    process.env.NEXT_PUBLIC_SUPABASE_URL === "https://your-project.supabase.co"
  );
}
