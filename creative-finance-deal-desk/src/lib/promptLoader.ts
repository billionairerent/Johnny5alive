import * as fs from "fs";
import * as path from "path";

/**
 * Loads prompt markdown files from the /prompts directory at the project root.
 * Supports simple {{variable}} substitution.
 */

const PROMPTS_DIR = path.resolve(__dirname, "..", "..", "prompts");

const cache = new Map<string, string>();

export function loadPrompt(name: string): string {
  const key = name.endsWith(".md") ? name : `${name}.md`;
  const cached = cache.get(key);
  if (cached !== undefined) return cached;

  const fullPath = path.join(PROMPTS_DIR, key);
  if (!fs.existsSync(fullPath)) {
    throw new Error(`Prompt not found: ${key} (looked in ${PROMPTS_DIR})`);
  }
  const content = fs.readFileSync(fullPath, "utf-8");
  cache.set(key, content);
  return content;
}

export function renderPrompt(
  name: string,
  vars: Record<string, unknown> = {}
): string {
  const template = loadPrompt(name);
  return template.replace(/{{\s*([\w.]+)\s*}}/g, (_match, key) => {
    const value = vars[key];
    if (value === undefined || value === null) return "";
    if (typeof value === "string") return value;
    return JSON.stringify(value, null, 2);
  });
}

export function clearPromptCache(): void {
  cache.clear();
}
