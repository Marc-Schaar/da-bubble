import { Component, inject, OnInit } from '@angular/core';
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
import { NavigationService } from '../service/navigation/navigation.service';
import { getMatIconFailedToSanitizeLiteralError } from '@angular/material/icon';

@Component({
  selector: 'app-sign-in',
  imports: [RouterLink, MatDividerModule, FormsModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent implements OnInit {
  error = false;
  disabled = true;
  shared = inject(UserService);
  auth = inject(Auth);
  firestore = inject(Firestore);
  fireService = inject(FireServiceService);
  authService: AuthService = inject(AuthService);
  navigationService: NavigationService = inject(NavigationService);
  user: User = new User();

  ngOnInit() {
    this.navigationService.isInitialize = false;
  }

  /**
   * Signs in the user with email and password.
   * @param form - The form containing the sign-in credentials.
   */
  public signin(form: NgForm) {
    try {
      this.authService.logInWithEmailAndPassword(this.user.email, this.user.password);
    } catch (error) {
      this.error = true;
      form.reset();
    }
  }

  /**
   * Signs in the user using Google authentication.
   */
  public signinwithgoogle() {
    this.authService.logInWithGoogle();
  }

  public guestLogin() {
    this.authService.loginAsGuest();
  }
}
