import { inject, Injectable } from '@angular/core';
import {
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  Firestore,
  increment,
  onSnapshot,
  serverTimestamp,
  setDoc,
  writeBatch,
} from '@angular/fire/firestore';
import { UnreadCounter } from '../../models/unread-counter/unread-counter';
import { toEntity } from '../../utils/firestore-entity.util';
import { runWrite } from '../../utils/run-write.util';

/**
 * Kapselt den Firestore-Zugriff auf `users/{userId}/unreadCounters` — pro
 * User ein Dokument je Chat (DM-conversationId oder channelId) mit einem
 * clientseitig hochgezählten Unread-Counter (kein Cloud-Functions-Backend
 * vorhanden, siehe firebase.json).
 */
@Injectable({
  providedIn: 'root',
})
export class UnreadApiService {
  private firestore: Firestore = inject(Firestore);

  public getUnreadCounterRef(userId: string, chatId: string): DocumentReference | null {
    return userId && chatId ? doc(this.firestore, `users/${userId}/unreadCounters/${chatId}`) : null;
  }

  public getUnreadCountersCollectionRef(userId: string): CollectionReference | null {
    return userId ? collection(this.firestore, `users/${userId}/unreadCounters`) : null;
  }

  /**
   * Streams a user's unread counters into a callback.
   * @returns The unsubscribe function of the listener.
   */
  public subUnreadCounters(userId: string, callback: (counters: UnreadCounter[]) => void): () => void {
    const ref = this.getUnreadCountersCollectionRef(userId);
    if (!ref) return () => {};

    return onSnapshot(
      ref,
      (snapshot) => callback(snapshot.docs.map((d) => toEntity<UnreadCounter>(d.id, d.data()))),
      (error) => console.error('Fehler beim Abonnieren der Unread-Zähler:', error),
    );
  }

  public async incrementUnread(userId: string, chatId: string, type: UnreadCounter['type']) {
    return runWrite(async () => {
      const ref = this.getUnreadCounterRef(userId, chatId);
      if (!ref) return;

      await setDoc(ref, { type, unreadCount: increment(1), updatedAt: serverTimestamp() }, { merge: true });
    }, 'Fehler beim Erhöhen des Unread-Zählers:');
  }

  /**
   * Bumps the same chat's unread counter for several recipients (channel
   * fan-out) in a single write batch instead of N separate round trips.
   */
  public async incrementUnreadBatch(userIds: string[], chatId: string, type: UnreadCounter['type']) {
    const uniqueIds = [...new Set(userIds)].filter(Boolean);
    if (uniqueIds.length === 0) return;

    return runWrite(async () => {
      const batch = writeBatch(this.firestore);
      for (const userId of uniqueIds) {
        const ref = this.getUnreadCounterRef(userId, chatId);
        if (ref) batch.set(ref, { type, unreadCount: increment(1), updatedAt: serverTimestamp() }, { merge: true });
      }
      await batch.commit();
    }, 'Fehler beim Erhöhen der Unread-Zähler:');
  }

  public async resetUnread(userId: string, chatId: string) {
    return runWrite(async () => {
      const ref = this.getUnreadCounterRef(userId, chatId);
      if (!ref) return;

      await setDoc(ref, { unreadCount: 0, updatedAt: serverTimestamp() }, { merge: true });
    }, 'Fehler beim Zurücksetzen des Unread-Zählers:');
  }
}
