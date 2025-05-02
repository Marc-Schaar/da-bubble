import { Component, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { GoogleAuthProvider, Auth } from '@angular/fire/auth';
import { signInWithEmailAndPassword, signInWithPopup, signInWithRedirect } from '@firebase/auth';
import { FormsModule, NgForm } from '@angular/forms';
import { FireServiceService } from '../fire-service.service';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
import { UserService } from '../shared.service';
import { User } from '../models/user/user';
import { AuthService } from '../service/auth/auth.service';

@Component({
  selector: 'app-sign-in',
  imports: [RouterLink, MatDividerModule, FormsModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent {
  error = false;
  disabled = true;
  shared = inject(UserService);
  auth = inject(Auth);
  firestore = inject(Firestore);
  fireService = inject(FireServiceService);
  authService: AuthService = inject(AuthService);
  user: User = new User();

  /**
   * Signs in the user with email and password.
   * @param form - The form containing the sign-in credentials.
   */
  signin(form: NgForm) {
    try {
      this.authService.logInWithEmailAndPassword(this.user.email, this.user.password);
      // await signInWithEmailAndPassword(this.auth, this.user.email, this.user.password);
      // await this.shared.setOnlineStatus();
      // this.shared.redirectiontodashboard();
    } catch (error) {
      this.error = true;
      form.reset();
    }
  }

  /**
   * Signs in the user using Google authentication.
   */
  signinwithgoogle() {
    this.authService.logInWithGoogle(this.user);
  }
}
