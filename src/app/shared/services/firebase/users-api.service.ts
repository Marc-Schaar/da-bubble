import { inject, Injectable, signal } from '@angular/core';
import { collection, doc, Firestore, onSnapshot, updateDoc } from '@angular/fire/firestore';
import { User } from '../../../features/auth/models/user/user';

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
   * Updates the online status of the current user in Firestore.
   *
   * @param currentUser The user object containing the UID and online status.
   */
  async updateOnlineStatus(currentUser: User) {
    if (currentUser.id) {
      const userRef = doc(this.firestore, 'users', currentUser.id);
      await updateDoc(userRef, {
        online: currentUser.online,
      });
    }
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
        const users = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as User,
        );
        this.allUsers.set(users);
      },
      (error) => {
        console.error('Fehler beim User-Streaming:', error);
      },
    );
  }
}
