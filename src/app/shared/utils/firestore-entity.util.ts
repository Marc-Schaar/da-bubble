/**
 * Merges a Firestore document's data with its id — id always wins over a
 * same-named field inside the document, since the doc id is the source
 * of truth and stored data must never be able to spoof it.
 */
export function toEntity<T>(id: string, data: unknown): T {
  return { ...(data as object), id } as T;
}
