import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, MatIcon, RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  public authService: AuthService = inject(AuthService);
  private navigationService: NavigationService = inject(NavigationService);
  public registerForm = this.authService.createRegisterForm();

  public onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }
    this.authService.setStep1Data(this.registerForm.getRawValue());
    this.navigationService.gotToAvatarSelection();
  }
}
