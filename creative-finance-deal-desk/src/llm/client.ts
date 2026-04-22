import { config } from "../config";
import { logger } from "../lib/logger";

/**
 * LLM client interface. The concrete transport is swappable.
 *
 * By default we use a stub that echoes a JSON-shaped empty object. This lets
 * the rest of the system run in local / test environments without an API key
 * while still being validated by the schema layer (which will usually fail
 * and surface a clear error until a real LLM client is wired in).
 *
 * Tests and workflows should prefer to inject a deterministic client.
 */

export interface LLMRequest {
  system: string;
  user: string;
  /** When true the model is instructed to return strict JSON. */
  json?: boolean;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMResponse {
  text: string;
}

export interface LLMClient {
  complete(req: LLMRequest): Promise<LLMResponse>;
}

/**
 * Default stub. Returns an empty JSON object string for JSON requests, or an
 * empty string otherwise. Intentionally minimal — real deployments should
 * replace this via `setLLMClient(...)`.
 */
export class StubLLMClient implements LLMClient {
  async complete(req: LLMRequest): Promise<LLMResponse> {
    logger.warn("StubLLMClient used — wire a real LLM client via setLLMClient()", {
      hasApiKey: Boolean(config.llm.apiKey),
      model: config.llm.model,
    });
    if (req.json) {
      return { text: "{}" };
    }
    return { text: "" };
  }
}

let activeClient: LLMClient = new StubLLMClient();

export function setLLMClient(client: LLMClient): void {
  activeClient = client;
}

export function getLLMClient(): LLMClient {
  return activeClient;
}

/**
 * Utility to pull the first JSON object out of a response. LLMs sometimes
 * wrap their output in markdown fences or prose.
 */
export function extractJson(text: string): unknown {
  if (!text) throw new Error("Empty LLM response");
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fenced ? fenced[1] : text;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1 || end < start) {
    throw new Error("No JSON object found in LLM response");
  }
  const slice = candidate.slice(start, end + 1);
  return JSON.parse(slice);
}
