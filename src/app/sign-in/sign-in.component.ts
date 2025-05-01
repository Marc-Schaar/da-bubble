import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { GoogleAuthProvider, Auth, onAuthStateChanged } from '@angular/fire/auth';
import { signInWithEmailAndPassword, signInWithPopup, signOut } from '@firebase/auth';
import { FormsModule, NgForm } from '@angular/forms';
import { FireServiceService } from '../fire-service.service';
import { Firestore } from '@angular/fire/firestore';
import { User } from '../models/user/user';
import { UserService } from '../shared.service';

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
  googleAuthProvider = new GoogleAuthProvider();
  auth = inject(Auth);
  firestore = inject(Firestore);
  fireService = inject(FireServiceService);
  user: User = new User();

  /**
   * Signs in the user with email and password.
   * @param form - The form containing the sign-in credentials.
   */
  async signin(form: NgForm) {
    try {
      await signInWithEmailAndPassword(this.auth, this.user.email, this.user.password);
      await this.shared.setOnlineStatus();
      this.shared.redirectiontodashboard();
    } catch (error) {
      this.error = true;
      form.reset();
    }
  }

  /**
   * Signs in the user using Google authentication.
   */
  async signinwithgoogle() {
    try {
      await signInWithPopup(this.auth, this.googleAuthProvider);
      await this.shared.setOnlineStatus();
      this.shared.redirectiontodashboard();
    } catch (error) {}
  }
}
