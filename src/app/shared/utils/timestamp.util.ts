/**
 * A minimal type guard for Firestore Timestamp-like values, used internally
 * by `toDateSafe` when converting various date representations.
 */
type FirestoreTimestampLike = { toDate: () => Date };

/**
 * Checks whether a value looks like a Firestore Timestamp object.
 */
function isFirestoreTimestamp(value: unknown): value is FirestoreTimestampLike {
  return typeof value === 'object' && value !== null && typeof (value as FirestoreTimestampLike).toDate === 'function';
}

/**
 * Safely converts a Firestore Timestamp, Date, date string/number, or a
 * pending `serverTimestamp()` sentinel (an object with neither `toDate`
 * nor `seconds`, before the server has assigned the real value) into a
 * Date — never throws, falls back to "now" for anything unparseable.
 */
export function toDateSafe(value: unknown): Date {
  if (!value) return new Date();
  if (isFirestoreTimestamp(value)) return value.toDate();
  if (typeof value === 'object' && !('seconds' in (value as object))) return new Date();

  const date = new Date(value as string | number | Date);
  return isNaN(date.getTime()) ? new Date() : date;
}
