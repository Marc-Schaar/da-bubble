import { Pipe, PipeTransform } from '@angular/core';

type FirestoreTimestampLike = { toDate: () => Date };

function isFirestoreTimestamp(value: unknown): value is FirestoreTimestampLike {
  return typeof value === 'object' && value !== null && typeof (value as FirestoreTimestampLike).toDate === 'function';
}

/**
 * Formats a Date/Firestore-Timestamp as a relative day label for message
 * dividers: "Heute" for the current day, otherwise the German weekday and
 * date (e.g. "Montag, 12. Juli").
 */
@Pipe({
  name: 'relativeDate',
})
export class RelativeDatePipe implements PipeTransform {
  transform(value: Date | FirestoreTimestampLike | string | null | undefined): string {
    if (!value) return '';
    const date = isFirestoreTimestamp(value) ? value.toDate() : new Date(value);

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

    if (isToday) return 'Heute';

    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  }
}
