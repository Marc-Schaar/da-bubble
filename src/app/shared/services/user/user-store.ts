import { Injectable, signal } from '@angular/core';
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
  private readonly _currentUser = signal<User | null>(null);
  public readonly currentUser = this._currentUser.asReadonly();

  public setCurrentUser(user: User | null): void {
    this._currentUser.set(user);
  }
}
