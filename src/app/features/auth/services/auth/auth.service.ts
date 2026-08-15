import { computed, inject, Injectable, signal } from '@angular/core';

import {
  Auth,
  confirmPasswordReset,
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
  updateProfile,
  verifyPasswordResetCode,
} from '@angular/fire/auth';

import { onAuthStateChanged, sendPasswordResetEmail, signInWithEmailAndPassword } from '@firebase/auth';

import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { UserStore } from '../../../../shared/services/user/user-store';
import { NotificationService } from '../../../../shared/services/notification/notification.service';
import { RegisterData, User } from '../../models/user/user';
import { DEFAULT_CHANNEL_ID, GUEST_EMAIL } from '../../../../shared/constants';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private navigationService: NavigationService = inject(NavigationService);
  private fireService = inject(FireServiceService);
  private notificationService = inject(NotificationService);
  private googleAuthProvider = new GoogleAuthProvider();

  isLoading = signal(false);

  public errorMessage = signal<string | null>(null);

  private tempUserData = signal<RegisterData | null>(null);

  private userStore = inject(UserStore);
  public currentUser = this.userStore.currentUser;
  public readonly isGuest = computed(() => this.currentUser()?.email === GUEST_EMAIL);
  private unsubUserDoc?: () => void;

  constructor() {
    this.setCurrentUser();
  }

  public setStep1Data(data: RegisterData) {
    this.tempUserData.set(data);
  }

  public getUserName() {
    return this.tempUserData()?.displayName;
  }

  public async completeRegistration(photoUrl: string): Promise<void> {
    const data = this.tempUserData();
    if (!data) return this.handleRegError('Keine Daten gefunden');

    this.isLoading.set(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      const newUser = this.mapFirebaseUserToUser(userCredential.user, {
        displayName: data.displayName,
        photoUrl: photoUrl,
        online: false,
      });

      await Promise.all([
        this.updateFirebaseProfile(firebaseUser, newUser.displayName, photoUrl),
        this.syncUserToFirestore(firebaseUser, newUser.displayName, photoUrl),
      ]);

      this.finalizeRegistration();
    } catch (error) {
      this.handleRegError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  private async updateFirebaseProfile(user: any, name: string, photo: string) {
    return updateProfile(user, { displayName: name, photoURL: photo });
  }

  private async syncUserToFirestore(firebaseUser: any, name: string, photo: string) {
    const userData = this.mapFirebaseUserToUser(firebaseUser, {
      displayName: name,
      photoUrl: photo,
    });
    await this.addInUserCollection(userData);
    await this.addInDefaultChannel(userData);
  }

  private finalizeRegistration() {
    this.tempUserData.set(null);
    this.notificationService.success('Konto erfolgreich erstellt!');
    this.navigationService.gotToChat();
  }

  /**
   * Adds a user to the user collection in Firestore.
   * This method is used when a user registers or logs in.
   *
   * @param user - The user to be added to the user collection
   */
  private async addInUserCollection(user: User) {
    await this.fireService.createUser(user);
  }

  /**
   * Adds a user to the default channel.
   * This method is used when a user registers or logs in.
   *
   * @param user - The user to be added to the default channel
   */
  private async addInDefaultChannel(user: User) {
    try {
      await this.fireService.addChannelMembers(DEFAULT_CHANNEL_ID, [{ id: user.id }]);
    } catch (error) {
      console.error('Fehler beim Hinzufügen zum Standardkanal:', error);
    }
  }

  /**
   * Logs in a user using email and password.
   * Sets the user online and redirects to the dashboard on success.
   * Sets an error flag on failure.
   *
   * @param email - User's email address
   * @param password - User's password
   */
  public async logInWithEmailAndPassword(email: string, password: string) {
    this.isLoading.set(true);
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
      await this.fireService.updateOnlineStatus({ ...this.mapFirebaseUserToUser(result.user), online: true });
      this.notificationService.success('Erfolgreich angemeldet!');
      this.navigationService.gotToChat();
    } catch (error) {
      this.handleRegError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Logs in a user with Google authentication.
   * Updates user profile and sets online status.
   * Creates a user document in Firestore if needed.
   * Sets an error flag on failure.
   */
  public async logInWithGoogle() {
    this.isLoading.set(true);
    try {
      const result = await signInWithPopup(this.auth, this.googleAuthProvider);
      if (result) {
        await updateProfile(result.user, {
          photoURL: 'img/avatars/avatar_default.png',
        });

        const userData = this.mapFirebaseUserToUser(result.user);
        await this.addInUserCollection(userData);
        await this.addInDefaultChannel(userData);
        this.notificationService.success('Erfolgreich angemeldet!');
        this.navigationService.gotToChat();
      }
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        console.error('Netzwerkfehler: Prüfe Adblocker oder Firewall!');
      }
      this.handleRegError(error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Logs in the user anonymously as a guest.
   * Creates a guest profile in Firestore and redirects to the dashboard.
   * Sets loading state and logs errors if any occur.
   */
  public async loginAsGuest() {
    this.isLoading.set(true);
    const GUEST_PW = 'Gast1234';

    try {
      const result = await signInWithEmailAndPassword(this.auth, GUEST_EMAIL, GUEST_PW);
      await this.handleGuestSync(result.user);
    } catch (error: any) {
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential') {
        try {
          const result = await createUserWithEmailAndPassword(this.auth, GUEST_EMAIL, GUEST_PW);
          await this.handleGuestSync(result.user);
        } catch (createError) {
          this.handleRegError(createError);
        }
      } else {
        this.handleRegError(error);
      }
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Hilfsmethode, um den Gast-Datensatz in Firestore konsistent zu halten
   */
  private async handleGuestSync(firebaseUser: any) {
    const guestData = this.mapFirebaseUserToUser(firebaseUser, {
      displayName: 'Gast-Besucher',
      photoUrl: 'img/avatars/avatar_default.png',
    });

    await this.addInUserCollection(guestData);
    await this.addInDefaultChannel(guestData);
    this.notificationService.success('Erfolgreich angemeldet!');
    this.navigationService.gotToChat();
  }

  /**
   * Sets the current user by subscribing to the auth state.
   * Retrieves the user from Firebase authentication.
   */
  setCurrentUser() {
    onAuthStateChanged(this.auth, (firebaseUser) => {
      this.unsubUserDoc?.();
      this.unsubUserDoc = undefined;

      if (firebaseUser) {
        this.userStore.setCurrentUser(this.mapFirebaseUserToUser(firebaseUser));

        this.unsubUserDoc = this.fireService.subUserDoc(firebaseUser.uid, (firestoreData) => {
          if (firestoreData) this.userStore.setCurrentUser(firestoreData);
        });
      } else {
        this.userStore.setCurrentUser(null);
      }
    });
  }

  /**
   * Logs out the currently authenticated user.
   * Updates online status, deletes anonymous user data, and redirects to the login page.
   */
  public async logOut() {
    this.isLoading.set(true);
    try {
      const user = this.currentUser();
      if (user) {
        await this.fireService.updateOnlineStatus({ ...user, online: false });
      }
      await signOut(this.auth);
      this.navigationService.goToLogin();
    } catch (error) {
      console.error('Logout Fehler:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Sends a password-reset e-mail via Firebase Auth.
   *
   * @param email - Address to send the reset link to.
   */
  public async sendPasswordReset(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  /**
   * Validates a password-reset link's oobCode before showing the reset form.
   * Rejects if the link is expired, already used, or malformed.
   */
  public async verifyPasswordResetCode(code: string): Promise<string> {
    return verifyPasswordResetCode(this.auth, code);
  }

  /**
   * Completes a password reset for the given oobCode.
   */
  public async confirmPasswordReset(code: string, newPassword: string): Promise<void> {
    await confirmPasswordReset(this.auth, code, newPassword);
  }

  /**
   * Updates the current user's display name and avatar in Firebase Auth,
   * Firestore and the local UserStore signal, so every consumer stays in sync.
   *
   * @param displayName - The new display name.
   * @param photoUrl - The new avatar URL.
   */
  public async updateUserProfile(displayName: string, photoUrl: string): Promise<void> {
    const firebaseUser = this.auth.currentUser;
    if (!firebaseUser) return;

    await this.updateFirebaseProfile(firebaseUser, displayName, photoUrl);
    await this.fireService.updateUser(firebaseUser.uid, { displayName, photoUrl });

    const current = this.currentUser();
    this.userStore.setCurrentUser(current ? { ...current, displayName, photoUrl } : null);
  }

  private mapFirebaseUserToUser(firebaseUser: any, overrides?: Partial<User>): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Unbekannter Nutzer',
      photoUrl: firebaseUser.photoURL || 'img/avatars/avatar_default.png',
      online: true,
      ...overrides,
    };
  }

  private handleRegError(error: any) {
    this.errorMessage.set(this.getFriendlyErrorMessage(error.code));
  }

  private getFriendlyErrorMessage(code: string): string {
    switch (code) {
      case 'auth/invalid-credential':
        return 'E-Mail oder Passwort falsch.';
      case 'auth/network-request-failed':
        return 'Netzwerkfehler. Prüfe deinen Adblocker.';
      default:
        return 'Ein unerwarteter Fehler ist aufgetreten.';
    }
  }

}
