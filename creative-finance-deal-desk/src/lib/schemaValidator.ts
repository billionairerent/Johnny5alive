import Ajv, { ErrorObject, ValidateFunction } from "ajv";
import addFormats from "ajv-formats";
import * as fs from "fs";
import * as path from "path";

const SCHEMAS_DIR = path.resolve(__dirname, "..", "..", "schemas");

const ajv = new Ajv({ allErrors: true, strict: false });
addFormats(ajv);

const validators = new Map<string, ValidateFunction>();

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

function loadSchema(name: string): ValidateFunction {
  const existing = validators.get(name);
  if (existing) return existing;

  const file = name.endsWith(".schema.json") ? name : `${name}.schema.json`;
  const schemaPath = path.join(SCHEMAS_DIR, file);
  if (!fs.existsSync(schemaPath)) {
    throw new Error(`Schema not found: ${file} (looked in ${SCHEMAS_DIR})`);
  }
  const schema = JSON.parse(fs.readFileSync(schemaPath, "utf-8"));
  const compiled = ajv.compile(schema);
  validators.set(name, compiled);
  return compiled;
}

function formatErrors(errors: ErrorObject[] | null | undefined): string[] {
  if (!errors) return [];
  return errors.map((e) => `${e.instancePath || "/"} ${e.message ?? "invalid"}`.trim());
}

export function validate(schemaName: string, data: unknown): ValidationResult {
  const validator = loadSchema(schemaName);
  const ok = validator(data) as boolean;
  return {
    valid: ok,
    errors: ok ? [] : formatErrors(validator.errors),
  };
}

export function assertValid(schemaName: string, data: unknown): void {
  const result = validate(schemaName, data);
  if (!result.valid) {
    throw new Error(
      `Schema validation failed for ${schemaName}: ${result.errors.join("; ")}`
    );
  }
}
