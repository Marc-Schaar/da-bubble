import { inject, Injectable, signal } from '@angular/core';

import { Auth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, updateProfile } from '@angular/fire/auth';

import { arrayUnion, deleteDoc, doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { signInAnonymously, signInWithEmailAndPassword } from '@firebase/auth';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { UserService } from '../../../../shared/services/user/shared.service';
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
  private userService: UserService = inject(UserService);
  private fireService = inject(FireServiceService);
  googleAuthProvider = new GoogleAuthProvider();
  error = false;
  isLoading = false;

  //Ab hier refactored
  private formBuilder = inject(FormBuilder);
  private readonly passwordPattern = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{6,}$';
  private tempUserData = signal<RegisterData | null>(null);

  private _currentUser = signal<User | null>(null);
  public currentUser = this._currentUser.asReadonly();

  public setStep1Data(data: RegisterData) {
    this.tempUserData.set(data);
  }

  public getUserName() {
    return this.tempUserData()?.displayName;
  }

  public async completeRegistration(avatarUrl: string): Promise<void> {
    const data = this.tempUserData();
    if (!data) return this.handleRegError('Keine Daten gefunden');

    this.isLoading = true;
    try {
      const userCredential = await createUserWithEmailAndPassword(this.auth, data.email, data.password);
      const firebaseUser = userCredential.user;
      const newUser: User = {
        id: firebaseUser.uid,
        email: data.email,
        displayName: data.displayName,
        avatarUrl: avatarUrl,
        online: false,
      };

      await Promise.all([
        this.updateFirebaseProfile(firebaseUser, newUser.displayName, avatarUrl),
        this.syncUserToFirestore(firebaseUser, newUser.displayName, avatarUrl),
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

  private async syncUserToFirestore(user: any, name: string, photo: string) {
    const userData: User = {
      id: user.uid,
      displayName: name,
      email: user.email,
      avatarUrl: photo,
      online: false,
    };
    await this.addInUserCollection(userData);
    await this.addInDefaultChannel(userData);
  }

  private finalizeRegistration() {
    this.tempUserData.set(null);
    this.userService.setOnlineStatus();
    this.navigationService.gotToChat();
  }

  private handleRegError(error: any) {
    console.error('Registrierung Fehler:', error);
    this.error = true;
    this.isLoading = false;
  }

  /**
   * Adds a user to the user collection in Firestore.
   * This method is used when a user registers or logs in.
   *
   * @param user - The user to be added to the user collection
   */
  private async addInUserCollection(user: User) {
    const userDocRef = doc(this.firestore, `users/${user.id}`);
    await setDoc(userDocRef, {
      displayName: user.displayName,
      email: user.email,
      avatarUrl: user.avatarUrl,
      online: false,
      id: user.id,
    });
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
          fullname: user.displayName,
          email: user.email,
          profilephoto: user.avatarUrl,
          online: false,
          id: user.id,
        }),
      });
    } catch (error) {
      console.error('Fehler beim Hinzufügen zum Standardkanal:', error);
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
   * - **fullname**: Required field, minimum of 2 characters.
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
      await this.userService.setOnlineStatus();
      this.navigationService.gotToChat();
    } catch (error) {
      this.error = true;
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
    // try {
    //   const result = await signInWithPopup(this.auth, this.googleAuthProvider);
    //   const firebaseUser = result.user;
    //   await updateProfile(firebaseUser, {
    //     photoURL: 'img/profilephoto.png',
    //   });
    //   await this.addInUserCollection(firebaseUser);
    //   await this.addInDefaultChannel(firebaseUser);
    //   await this.shared.setOnlineStatus();
    //   this.shared.redirectiontodashboard();
    // } catch (error) {
    //   this.error = true;
    // } finally {
    //   this.isLoading = false;
    // }
  }

  /**
   * Logs in the user anonymously as a guest.
   * Creates a guest profile in Firestore and redirects to the dashboard.
   * Sets loading state and logs errors if any occur.
   */
  public async loginAsGuest() {
    // this.isLoading = true;
    // try {
    //   const result = await signInAnonymously(this.auth);
    //   await updateProfile(result.user, {
    //     displayName: 'Gast',
    //     photoURL: 'img/profilephoto.png',
    //   });
    //   await this.addInUserCollection(result.user);
    //   await this.shared.setOnlineStatus();
    //   this.shared.redirectiontodashboard();
    // } catch (error) {
    // } finally {
    //   this.isLoading = false;
    // }
  }

  /**
   * Logs out the currently authenticated user.
   * Updates online status, deletes anonymous user data, and redirects to the login page.
   */
  public async logOut() {
    //   this.navigationService.isInitialize = false;
    //   const currentUser = this.userService.getUser();
    //   currentUser.online = false;
    //   await this.fireService.updateOnlineStatus(currentUser);
    //   if (this.auth.currentUser?.isAnonymous) {
    //     await deleteDoc(doc(this.firestore, `users/${currentUser.id}`));
    //     await this.auth.currentUser.delete();
    //   } else {
    //     await signOut(this.auth);
    //   }
    //   this.userService.redirectiontologinpage();
  }
}
