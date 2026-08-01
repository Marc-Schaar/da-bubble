import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';

import { AuthService } from '../../services/auth/auth.service';
import { createResetPasswordForm } from '../../forms/auth-forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { NotificationService } from '../../../../shared/services/notification/notification.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent, MatIcon],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ResetPasswordComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly activatedRoute = inject(ActivatedRoute);

  public isSubmitting = signal(false);
  public isCodeValid = signal(true);
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
      this.isCodeValid.set(false);
    }
  }

  /**
   * Confirms the new password with Firebase Auth and redirects to the login page.
   */
  async onSubmit() {
    if (this.resetPasswordForm.invalid && this.isCodeValid()) {
      this.resetPasswordForm.markAllAsTouched();
      return;
    }

    if (!this.isCodeValid()) {
      this.router.navigate(['/forgot-password']);
      return;
    }
    this.isSubmitting.set(true);
    try {
      await this.authService.confirmPasswordReset(this.resetCode, this.resetPasswordForm.getRawValue().password);
      this.notificationService.success('Passwort geändert');
      this.resetPasswordForm.reset();
      setTimeout(() => this.router.navigate(['/']), 1500);
    } catch {
      this.isCodeValid.set(false);
    } finally {
      this.isSubmitting.set(false);
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
