const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isUuid(value?: string | null): boolean {
  return UUID_REGEX.test(value || "");
}

export function collectCollegeIdScopes(...values: Array<string | null | undefined>): string[] {
  const scopes = new Set<string>();
  for (const value of values) {
    const trimmed = (value || "").trim();
    if (!trimmed) continue;
    scopes.add(trimmed.toLowerCase());
  }
  return Array.from(scopes);
}
