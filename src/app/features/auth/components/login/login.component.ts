import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { createLoginForm } from '../../forms/auth-forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-login',
  imports: [RouterLink, MatDividerModule, FormsModule, ReactiveFormsModule, ButtonComponent, InputComponent],
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

  /**
   * Current email validation message, or null while the field is valid
   * or hasn't been touched yet.
   */
  protected getEmailError(): string | null {
    const control = this.loginForm.controls['email'];
    if (!control.invalid || !(control.touched || control.dirty)) return null;
    if (control.errors?.['required']) return '*Bitte Email Adresse eingeben.';
    if (control.errors?.['email']) return '*Diese E-Mail Adresse ist leider ungültig.';
    return null;
  }

  /**
   * Current password validation message, or null while the field is
   * valid/untouched. Falls back to the server-side auth error once the
   * field itself has no local validation error.
   */
  protected getPasswordError(): string | null {
    const control = this.loginForm.controls['password'];
    if (control.errors?.['required'] && (control.touched || control.dirty)) {
      return '*Bitte Password eingeben ';
    }
    if (this.authService.errorMessage()) {
      return '*Falsches Passwort oder E-Mail.. Bitte noch einmal versuchen. ';
    }
    return null;
  }
}
