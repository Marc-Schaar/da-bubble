import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth/auth.service';
import { createLoginForm } from '../../forms/auth-forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-sign-in',
  imports: [RouterLink, MatDividerModule, FormsModule, ReactiveFormsModule, ButtonComponent, InputComponent],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignInComponent {
  public readonly authService: AuthService = inject(AuthService);

  public readonly loginForm = createLoginForm(inject(FormBuilder));

  private formSubmitted = false;

  /**
   * Signs in the user with email and password.
   */
  public async onSubmit() {
    this.formSubmitted = true;
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
    this.formSubmitted = false;
    this.authService.loginAsGuest();
  }

  /**
   * Current email validation message. Only shown after a real submit
   * attempt via onSubmit — guest login never sets formSubmitted, so it
   * can't surface stray validation state from the login form.
   */
  protected getEmailError(): string | null {
    if (!this.formSubmitted) return null;
    const control = this.loginForm.controls['email'];
    if (control.errors?.['required']) return '*Bitte Email Adresse eingeben.';
    if (control.errors?.['email']) return '*Diese E-Mail Adresse ist leider ungültig.';
    return null;
  }

  /**
   * Current password validation message, only shown after a real submit
   * attempt via onSubmit. Falls back to the server-side auth error once
   * the field itself has no local validation error.
   */
  protected getPasswordError(): string | null {
    if (!this.formSubmitted) return null;
    const control = this.loginForm.controls['password'];
    if (control.errors?.['required']) {
      return '*Bitte Password eingeben ';
    }
    if (this.authService.errorMessage()) {
      return '*Falsches Passwort oder E-Mail.. Bitte noch einmal versuchen. ';
    }
    return null;
  }
}
