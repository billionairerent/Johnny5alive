/**
 * Central configuration.
 * Reads from process.env with safe fallbacks.
 * Do not throw at import time — adapters that actually need the vars
 * should validate on use.
 */

export interface AppConfig {
  airtable: {
    apiKey: string;
    baseId: string;
    sellersTable: string;
    buyersTable: string;
    matchesTable: string;
    tasksTable: string;
  };
  twilio: {
    accountSid: string;
    authToken: string;
    phoneNumber: string;
  };
  gmail: {
    user: string;
    appPassword: string;
  };
  llm: {
    apiKey: string;
    model: string;
  };
  storage: {
    path: string;
  };
  thresholds: {
    hotLeadScore: number;
    matchFitScore: number;
  };
}

function getEnv(name: string, fallback = ""): string {
  return process.env[name] ?? fallback;
}

function getNumberEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (raw === undefined || raw === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) ? n : fallback;
}

export const config: AppConfig = {
  airtable: {
    apiKey: getEnv("AIRTABLE_API_KEY"),
    baseId: getEnv("AIRTABLE_BASE_ID"),
    sellersTable: getEnv("AIRTABLE_SELLERS_TABLE", "Sellers"),
    buyersTable: getEnv("AIRTABLE_BUYERS_TABLE", "Buyers"),
    matchesTable: getEnv("AIRTABLE_MATCHES_TABLE", "Matches"),
    tasksTable: getEnv("AIRTABLE_TASKS_TABLE", "Tasks"),
  },
  twilio: {
    accountSid: getEnv("TWILIO_ACCOUNT_SID"),
    authToken: getEnv("TWILIO_AUTH_TOKEN"),
    phoneNumber: getEnv("TWILIO_PHONE_NUMBER"),
  },
  gmail: {
    user: getEnv("GMAIL_USER"),
    appPassword: getEnv("GMAIL_APP_PASSWORD"),
  },
  llm: {
    apiKey: getEnv("LLM_API_KEY"),
    model: getEnv("LLM_MODEL", "claude-opus-4-6"),
  },
  storage: {
    path: getEnv("STORAGE_PATH", "./storage"),
  },
  thresholds: {
    hotLeadScore: getNumberEnv("HOT_LEAD_SCORE_THRESHOLD", 8),
    matchFitScore: getNumberEnv("MATCH_FIT_SCORE_THRESHOLD", 7),
  },
};
