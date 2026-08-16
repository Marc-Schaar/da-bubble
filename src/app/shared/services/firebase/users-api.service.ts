import { inject, Injectable, signal } from '@angular/core';
import { collection, doc, Firestore, onSnapshot, setDoc, updateDoc } from '@angular/fire/firestore';
import { User } from '../../../features/auth/models/user/user';
import { toEntity } from '../../utils/firestore-entity.util';
import { runWrite } from '../../utils/run-write.util';

/**
 * Kapselt den Firestore-Zugriff auf die `users`-Collection.
 */
@Injectable({
  providedIn: 'root',
})
export class UsersApiService {
  private firestore: Firestore = inject(Firestore);
  public allUsers = signal<User[]>([]);
  private unsubAllUsers?: () => void;

  /**
   * Creates (or overwrites) a user's document — used on registration,
   * Google sign-in and guest login.
   */
  async createUser(user: User) {
    return runWrite(() => {
      const userDocRef = doc(this.firestore, 'users', user.id);
      return setDoc(userDocRef, { ...user });
    }, 'Fehler beim Anlegen des Nutzers:');
  }

  /**
   * Updates the online status of the current user in Firestore.
   *
   * @param currentUser The user object containing the UID and online status.
   */
  async updateOnlineStatus(currentUser: User) {
    if (!currentUser.id) return;
    return runWrite(() => {
      const userRef = doc(this.firestore, 'users', currentUser.id);
      return updateDoc(userRef, { online: currentUser.online });
    }, 'Fehler beim Aktualisieren des Online-Status:');
  }

  /**
   * Partially updates a user's document (e.g. displayName/photoUrl after a profile edit).
   */
  async updateUser(userId: string, data: Partial<User>) {
    return runWrite(() => {
      const userRef = doc(this.firestore, 'users', userId);
      return updateDoc(userRef, data);
    }, 'Fehler beim Aktualisieren des Nutzers:');
  }

  /**
   * Subscribes to live changes of a single user's document
   * (used to keep the current user in sync across tabs/devices).
   */
  subUserDoc(userId: string, callback: (user: User | null) => void): () => void {
    const userRef = doc(this.firestore, 'users', userId);
    return onSnapshot(userRef, (docSnap) => {
      callback(docSnap.exists() ? (docSnap.data() as User) : null);
    });
  }

  /**
   * Erstellt eine permanente Verbindung zur User-Collection.
   * Jede Änderung (Login/Logout/Neuer User) triggert das Signal sofort.
   * Idempotent: der Listener lebt für die App-Lebensdauer, weitere Aufrufe
   * sind No-ops (vorher entstand pro Aufruf ein neuer Listener).
   */
  public subAllUsers(): void {
    if (this.unsubAllUsers) return;
    const usersCollection = collection(this.firestore, 'users');

    this.unsubAllUsers = onSnapshot(
      usersCollection,
      (snapshot) => {
        const users = snapshot.docs.map((doc) => toEntity<User>(doc.id, doc.data()));
        console.log(
          '[UsersDebug] snapshot:',
          users.length,
          'docs, fromCache:',
          snapshot.metadata.fromCache,
          'ids/emails:',
          users.map((u) => `${u.id}:${u.email}`),
        );
        this.allUsers.set(users);
      },
      (error) => {
        console.error('[UsersDebug] Fehler beim User-Streaming:', error);
      },
    );
  }
}
