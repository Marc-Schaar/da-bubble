import { inject, Injectable } from '@angular/core';
import { UserService } from '../../shared.service';
import { Auth, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut, updateProfile } from '@angular/fire/auth';
import { NavigationService } from '../navigation/navigation.service';
import { User } from '../../models/user/user';
import { arrayUnion, doc, setDoc, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { signInWithEmailAndPassword } from '@firebase/auth';
import { FireServiceService } from '../../fire-service.service';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private userService: UserService = inject(UserService);
  private auth: Auth = inject(Auth);
  private navigationService: NavigationService = inject(NavigationService);
  private firestore: Firestore = inject(Firestore);
  private shared: UserService = inject(UserService);
  private fireService = inject(FireServiceService);
  googleAuthProvider = new GoogleAuthProvider();

  constructor() {}

  public async logInWithEmailAndPassword(email: string, password: string) {
    await signInWithEmailAndPassword(this.auth, email, password);
    await this.shared.setOnlineStatus();
    this.shared.redirectiontodashboard();
  }

  public async logInWithGoogle(user: User) {
    await signInWithPopup(this.auth, this.googleAuthProvider);
    // const userDocRef = doc(this.firestore, `users/${user.fullname}`);
    // return setDoc(userDocRef, {
    //   fullname: user.fullname,
    //   email: user.email,
    //   profilephoto: user.profilephoto,
    //   online: false,
    // });
    //  await this.shared.setOnlineStatus();
    this.shared.redirectiontodashboard();
  }

  async register(user: User): Promise<void> {
    const userCredential = await createUserWithEmailAndPassword(this.auth, user.email, user.password);
    const firebaseUser = userCredential.user;

    await updateProfile(firebaseUser, {
      displayName: user.fullname,
      photoURL: user.profilephoto,
    });

    const userDocRef = doc(this.firestore, `users/${firebaseUser.uid}`);
    await setDoc(userDocRef, {
      fullname: user.fullname,
      email: user.email,
      profilephoto: user.profilephoto,
      online: false,
    });

    const defaultChannelRef = doc(this.firestore, `channels/KqvcY68R1jP2UsQkv6Nz`);
    await updateDoc(defaultChannelRef, {
      member: arrayUnion({
        fullname: user.fullname,
        email: user.email,
        profilephoto: user.profilephoto,
        online: false,
      }),
    });
  }

  public async logOut() {
    const currentUser = this.userService.getUser();
    if (this.auth.currentUser?.providerData[0].providerId !== 'google.com') {
      currentUser.online = false;
      await this.fireService.updateOnlineStatus(currentUser);
    }
    await signOut(this.auth);
    this.navigationService.isInitialize = false;
    this.userService.redirectiontologinpage();
  }
}
