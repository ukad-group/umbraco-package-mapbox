import type { UmbPropertyEditorConfigCollection } from "@umbraco-cms/backoffice/property-editor";

/** Same as Object.toBoolean in the AngularJS backoffice: true, "true", "1" and 1 are true. */
export function toBoolean(value: unknown): boolean {
  if (typeof value === "string") {
    return value.toLowerCase() === "true" || value === "1";
  }

  return value === true || value === 1;
}

export function getBoolean(
  config: UmbPropertyEditorConfigCollection | undefined,
  alias: string,
  defaultValue: boolean,
): boolean {
  const value = config?.getValueByAlias<unknown>(alias);
  return value != null ? toBoolean(value) : defaultValue;
}

/**
 * Value to show in a number field. Keeps what the user typed while it still means the same number,
 * so re-rendering does not turn "2.30" into "2.3" in the middle of typing.
 */
export function numberFieldValue(value: number | undefined, typed: string): string {
  if (value == null || !Number.isFinite(value)) {
    return "";
  }

  return parseFloat(typed) === value ? typed : String(value);
}

/** Parses a number field; returns undefined while the text is not a number yet (e.g. "-"). */
export function parseNumberField(e: Event): { typed: string; value: number | undefined } {
  const typed = (e.target as HTMLInputElement).value;
  const value = parseFloat(typed);
  return { typed, value: Number.isFinite(value) ? value : undefined };
}
