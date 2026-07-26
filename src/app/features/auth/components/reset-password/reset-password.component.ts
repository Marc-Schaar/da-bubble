import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { AuthService } from '../../services/auth/auth.service';
import { createResetPasswordForm } from '../../forms/auth-forms';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { InputDirective } from '../../../../shared/components/input/input.directive';
import { FieldErrorComponent } from '../../../../shared/components/input/field-error.component';

@Component({
  selector: 'app-resetpassword',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, ReactiveFormsModule, RouterLink, ButtonDirective, InputDirective, FieldErrorComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetpasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  public isOverlayActive = false;
  public isCodeValid = true;
  public resetCode = '';

  public resetPasswordForm = createResetPasswordForm(inject(FormBuilder));

  /**
   * Verifies the oobCode from the reset e-mail before showing the form —
   * an expired or already-used link shows an error instead of a dead-end form.
   */
  async ngOnInit() {
    this.resetCode = this.activatedRoute.snapshot.queryParamMap.get('oobCode') || '';
    try {
      await this.authService.verifyPasswordResetCode(this.resetCode);
    } catch {
      this.isCodeValid = false;
    }
  }

  /**
   * Confirms the new password with Firebase Auth and redirects to the login page.
   */
  async onSubmit() {
    if (this.resetPasswordForm.invalid) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    this.isOverlayActive = true;
    try {
      await this.authService.confirmPasswordReset(this.resetCode, this.resetPasswordForm.getRawValue().password);
      this.resetPasswordForm.reset();
      setTimeout(() => this.router.navigate(['/']), 1500);
    } catch {
      this.isCodeValid = false;
    } finally {
      setTimeout(() => {
        this.isOverlayActive = false;
      }, 1500);
    }
  }

  protected getPasswordError(): string | null {
    const control = this.resetPasswordForm.controls['password'];
    if (control.invalid && (control.touched || control.dirty)) {
      return 'Das Passwort muss mindestens 6 Zeichen lang sein und einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten.';
    }
    return null;
  }

  protected getPasswordConfirmError(): string | null {
    const control = this.resetPasswordForm.controls['passwordConfirm'];
    if (control.touched && this.resetPasswordForm.errors?.['passwordMismatch']) {
      return 'Die Passwörter stimmen nicht überein.';
    }
    return null;
  }
}
