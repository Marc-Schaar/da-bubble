import { inject, Injectable, signal } from '@angular/core';

import { Auth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, updateProfile } from '@angular/fire/auth';

import { arrayUnion, doc, onSnapshot, setDoc, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { onAuthStateChanged, signInWithEmailAndPassword } from '@firebase/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { RegisterData, User } from '../../models/user/user';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private auth: Auth = inject(Auth);
  private navigationService: NavigationService = inject(NavigationService);
  private firestore: Firestore = inject(Firestore);
  private fireService = inject(FireServiceService);
  private googleAuthProvider = new GoogleAuthProvider();

  isLoading = false;

  public errorMessage = signal<string | null>(null);

  //Ab hier refactored
  private formBuilder = inject(FormBuilder);
  private readonly passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{6,}$';
  private tempUserData = signal<RegisterData | null>(null);

  private _currentUser = signal<User | null>(null);
  public currentUser = this._currentUser.asReadonly();

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

    this.isLoading = true;
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
      this.isLoading = false;
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
    this.navigationService.gotToChat();
  }

  /**
   * Adds a user to the user collection in Firestore.
   * This method is used when a user registers or logs in.
   *
   * @param user - The user to be added to the user collection
   */
  private async addInUserCollection(user: User) {
    const userDocRef = doc(this.firestore, `users/${user.id}`);
    await setDoc(userDocRef, { ...user });
  }

  /**
   * Adds a user to the default channel.
   * This method is used when a user registers or logs in.
   *
   * @param user - The user to be added to the default channel
   */
  private async addInDefaultChannel(user: User) {
    const defaultChannelRef = doc(this.firestore, `channels/KqvcY68R1jP2UsQkv6Nz`);
    try {
      await updateDoc(defaultChannelRef, {
        member: arrayUnion({
          displayName: user.displayName,
          email: user.email,
          photoUrl: user.photoUrl,
          online: false,
          id: user.id,
        }),
      });
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
    this.isLoading = true;
    try {
      await signInWithEmailAndPassword(this.auth, email, password);
      this.navigationService.gotToChat();
    } catch (error) {
      this.handleRegError(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Logs in a user with Google authentication.
   * Updates user profile and sets online status.
   * Creates a user document in Firestore if needed.
   * Sets an error flag on failure.
   */
  public async logInWithGoogle() {
    this.isLoading = true;
    try {
      const result = await signInWithPopup(this.auth, this.googleAuthProvider);
      if (result) {
        const userData = this.mapFirebaseUserToUser(result.user);
        await this.addInUserCollection(userData);
        await this.addInDefaultChannel(userData);
        this.navigationService.gotToChat();
      }
    } catch (error: any) {
      if (error.code === 'auth/network-request-failed') {
        console.error('Netzwerkfehler: Prüfe Adblocker oder Firewall!');
      }
      this.handleRegError(error);
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Logs in the user anonymously as a guest.
   * Creates a guest profile in Firestore and redirects to the dashboard.
   * Sets loading state and logs errors if any occur.
   */
  public async loginAsGuest() {
    this.isLoading = true;
    const GUEST_EMAIL = 'gast@portfolio.de';
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
      this.isLoading = false;
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
    this.navigationService.gotToChat();
  }

  /**
   * Sets the current user by subscribing to the auth state.
   * Retrieves the user from Firebase authentication.
   */
  setCurrentUser() {
    onAuthStateChanged(this.auth, (firebaseUser) => {
      if (firebaseUser) {
        this._currentUser.set(this.mapFirebaseUserToUser(firebaseUser));

        const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);

        onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const firestoreData = docSnap.data() as User;
            this._currentUser.set(firestoreData);
          }
        });
      } else {
        this._currentUser.set(null);
      }
    });
  }

  /**
   * Logs out the currently authenticated user.
   * Updates online status, deletes anonymous user data, and redirects to the login page.
   */
  public async logOut() {
    this.isLoading = true;
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
      this.isLoading = false;
    }
  }

  private mapFirebaseUserToUser(firebaseUser: any, overrides?: Partial<User>): User {
    return {
      id: firebaseUser.uid,
      email: firebaseUser.email || '',
      displayName: firebaseUser.displayName || 'Unbekannter Nutzer',
      photoUrl: firebaseUser.photoURL || 'img/avatar_default.png',
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

  /**
   * Gemeinsame Basis-Konfiguration für Login und Register
   */
  private get basicAuthFields() {
    return {
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(this.passwordPattern)]],
    };
  }

  /**
   * Initializes and configures the FormGroup for the login process.
   * * @description
   * Defines a form group containing 'email' and 'password' fields with the following rules:
   * - **email**: Required, must follow a valid email format.
   * - **password**: Required field.
   * * @returns {FormGroup} A configured FormGroup instance ready for template binding.
   */
  public createLoginForm(): FormGroup {
    return this.formBuilder.group(this.basicAuthFields);
  }

  /**
   * Initializes and configures the FormGroup for the user registration process.
   * * @description
   * This method extends the basic authentication fields (email and password)
   * with additional fields required for creating a new user account:
   * - **email**: Inherited from basicAuthFields (Required, Email format).
   * - **password**: Inherited from basicAuthFields (Required, Min length 6).
   * - **displayName**: Required field, minimum of 2 characters.
   * - **profilephoto**: Optional, defaults to a standard placeholder path.
   * - **acceptTerms**: Required to be 'true' (checkbox must be checked).
   * * @returns {FormGroup} A fully configured FormGroup for the registration template.
   */
  public createRegisterForm(): FormGroup {
    return this.formBuilder.group({
      ...this.basicAuthFields,
      displayName: ['', [Validators.required, Validators.minLength(5)]],
      photoURL: ['img/profilephoto.png'],
      acceptTerms: [false, [Validators.requiredTrue]],
    });
  }
}
