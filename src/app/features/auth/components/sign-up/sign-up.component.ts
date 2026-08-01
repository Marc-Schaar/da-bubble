import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { createRegisterForm } from '../../forms/auth-forms';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';

@Component({
  selector: 'app-sign-up',
  imports: [FormsModule, RouterLink, ReactiveFormsModule, ButtonComponent, InputComponent, MatIcon],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SignUpComponent {
  public authService: AuthService = inject(AuthService);
  private navigationService: NavigationService = inject(NavigationService);
  public registerForm = createRegisterForm(inject(FormBuilder));

  public onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.authService.setStep1Data(this.registerForm.getRawValue());
    this.navigationService.gotToAvatarSelection();
  }

  protected getDisplayNameError(): string | null {
    const control = this.registerForm.controls['displayName'];
    if (control.invalid && (control.touched || control.dirty)) {
      return 'Bitte schreiben Sie einen Namen. Mindestens 5 Zeichen';
    }
    return null;
  }

  protected getEmailError(): string | null {
    const control = this.registerForm.controls['email'];
    if (control.invalid && (control.touched || control.dirty)) {
      return '*Diese E-Mail-Adresse ist leider ungültig.';
    }
    return null;
  }

  protected getPasswordError(): string | null {
    const control = this.registerForm.controls['password'];
    if (control.invalid && (control.touched || control.dirty)) {
      return 'Bitte geben Sie ein Passwort ein. Es muss mindestens 6 Zeichen lang sein, einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten.';
    }
    return null;
  }
}
