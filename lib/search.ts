/** Case-insensitive match of a query against any of the provided fields. */
export function matchesSearch(query: string, ...fields: (string | number | null | undefined)[]): boolean {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return true;
  return fields.some((field) => field != null && String(field).toLowerCase().includes(normalized));
}
