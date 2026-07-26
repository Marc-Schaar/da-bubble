import { Component, inject } from '@angular/core';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { AuthService } from '../../services/auth/auth.service';
import { createForgotPasswordForm } from '../../forms/auth-forms';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';
import { InputDirective } from '../../../../shared/components/input/input.directive';
import { FieldErrorComponent } from '../../../../shared/components/input/field-error.component';

@Component({
  selector: 'app-forgotpassword',
  imports: [HeaderComponent, FooterComponent, ReactiveFormsModule, RouterLink, ButtonDirective, InputDirective, FieldErrorComponent],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotpasswordComponent {
  private readonly authService = inject(AuthService);

  isOverlayActive = false;
  submitted = false;

  public forgotPasswordForm = createForgotPasswordForm(inject(FormBuilder));

  /**
   * Handles the form submission, sends a password reset email and manages loading state.
   */
  async onSubmit() {
    if (this.forgotPasswordForm.invalid) {
      this.forgotPasswordForm.markAllAsTouched();
      return;
    }

    this.isOverlayActive = true;
    try {
      await this.authService.sendPasswordReset(this.forgotPasswordForm.getRawValue().email);
    } catch {
      // Kein sichtbarer Fehlerzustand im bisherigen UI vorgesehen; still scheitern.
    }
    this.submitted = true;
    this.forgotPasswordForm.reset();
    setTimeout(() => {
      this.isOverlayActive = false;
      this.submitted = false;
    }, 1500);
  }

  protected getEmailError(): string | null {
    const control = this.forgotPasswordForm.controls['email'];
    if (control.invalid && (control.touched || control.dirty)) {
      return '*Diese E-Mail-Adresse ist leider ungültig.';
    }
    return null;
  }
}
