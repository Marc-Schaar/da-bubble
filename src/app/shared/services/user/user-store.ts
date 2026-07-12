import { inject, Injectable, signal } from '@angular/core';
import { collection, doc, Firestore, getDoc, getDocs, query, where } from '@angular/fire/firestore';
import { User } from '../../../features/app_auth/models/user/user';

/**
 * Holds the authenticated user's data. AuthService writes to it,
 * everyone else (FireService, components) reads the signal — this
 * breaks the former FireService <-> AuthService injection cycle.
 */
@Injectable({
  providedIn: 'root',
})
export class UserStore {
  private readonly firestore = inject(Firestore);

  private readonly _currentUser = signal<User | null>(null);
  public readonly currentUser = this._currentUser.asReadonly();

  public setCurrentUser(user: User | null): void {
    this._currentUser.set(user);
  }

  /**
   * Fetches a user document by its id.
   */
  public async getUserById(id: string): Promise<User | null> {
    if (!id) return null;
    const snap = await getDoc(doc(this.firestore, 'users', id));
    return snap.exists() ? ({ ...(snap.data() as Omit<User, 'id'>), id: snap.id } as User) : null;
  }

  /**
   * Looks up a user document by its displayName (used for @mentions).
   */
  public async findUserByDisplayName(displayName: string): Promise<User | null> {
    const usersRef = collection(this.firestore, 'users');
    const q = query(usersRef, where('displayName', '==', displayName));
    const snapshot = await getDocs(q);
    const docSnap = snapshot.docs[0];
    return docSnap ? ({ ...(docSnap.data() as Omit<User, 'id'>), id: docSnap.id } as User) : null;
  }
}
