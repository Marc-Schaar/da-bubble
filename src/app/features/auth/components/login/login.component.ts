import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { createLoginForm } from '../../forms/auth-forms';

@Component({
  selector: 'app-login',
  imports: [RouterLink, MatDividerModule, FormsModule, MatIconModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  disabled = true;
  authService: AuthService = inject(AuthService);
  navigationService: NavigationService = inject(NavigationService);

  public loginForm = createLoginForm(inject(FormBuilder));

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
