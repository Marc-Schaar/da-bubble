import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';

import { FormBuilder, ReactiveFormsModule } from '@angular/forms';

import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { HeaderUserMenuComponent } from '../../../../shared/components/header-user-menu/header-user-menu.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { AuthService } from '../../services/auth/auth.service';
import { createResetPasswordForm } from '../../forms/auth-forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [HeaderComponent, HeaderUserMenuComponent, FooterComponent, ReactiveFormsModule, RouterLink, ButtonComponent, InputComponent],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {
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
