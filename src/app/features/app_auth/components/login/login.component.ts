import { Component, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { Auth } from '@angular/fire/auth';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Firestore } from '@angular/fire/firestore';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../../../shared/services/user/shared.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-login',
  imports: [RouterLink, MatDividerModule, FormsModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent implements OnInit {
  disabled = true;
  shared = inject(UserService);
  auth = inject(Auth);
  firestore = inject(Firestore);
  fireService = inject(FireServiceService);
  authService: AuthService = inject(AuthService);
  navigationService: NavigationService = inject(NavigationService);

  public loginForm = this.authService.createLoginForm();

  /**
   * Lifecycle hook that runs on component initialization.
   * Resets the navigation service's initialization status to false.
   */
  ngOnInit() {
    this.navigationService.isInitialize = false;
  }

  /**
   * Signs in the user with email and password.
   */
  public async onSubmit() {
    if (this.loginForm.invalid) this.loginForm.markAllAsTouched();
    const payload = this.loginForm.getRawValue();
    await this.authService.logInWithEmailAndPassword(payload.email, payload.password);
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
