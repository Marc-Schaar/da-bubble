import { Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { createForgotPasswordForm } from '../../forms/auth-forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { NotificationService } from '../../../../shared/services/notification/notification.service';

@Component({
  selector: 'app-forgot-password',
  imports: [ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  isSubmitting = false;

  public forgotPasswordForm = createForgotPasswordForm(inject(FormBuilder));

  /**
   * Handles the form submission, sends a password reset email and manages loading state.
   */
  async onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isSubmitting = true;
    try {
      await this.authService.sendPasswordReset(this.forgotPasswordForm.getRawValue().email);
      this.notificationService.success('E-Mail gesendet');
      this.forgotPasswordForm.reset();
    } catch {
      this.notificationService.error('E-Mail konnte nicht gesendet werden.');
    } finally {
      this.isSubmitting = false;
    }
  }

  protected getEmailError(): string | null {
    const control = this.forgotPasswordForm.controls['email'];
    if (control.invalid && (control.touched || control.dirty)) {
      return '*Diese E-Mail-Adresse ist leider ungültig.';
    }
    return null;
  }
}
