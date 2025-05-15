import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { Auth } from '@angular/fire/auth';
import { FormsModule, NgForm } from '@angular/forms';
import { FireServiceService } from '../services/firebase/fire-service.service';
import { Firestore } from '@angular/fire/firestore';
import { UserService } from '../services/user/shared.service';
import { User } from '../models/user/user';
import { AuthService } from '../services/auth/auth.service';
import { NavigationService } from '../services/navigation/navigation.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-sign-in',
  imports: [RouterLink, MatDividerModule, FormsModule, MatIconModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent implements OnInit {
  disabled = true;
  shared = inject(UserService);
  auth = inject(Auth);
  firestore = inject(Firestore);
  fireService = inject(FireServiceService);
  authService: AuthService = inject(AuthService);
  navigationService: NavigationService = inject(NavigationService);
  user: User = new User();

  /**
   * Lifecycle hook that runs on component initialization.
   * Resets the navigation service's initialization status to false.
   */
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
      this.authService.error = true;
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
