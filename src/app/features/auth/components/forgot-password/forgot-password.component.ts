import { Component, inject } from '@angular/core';

import { FormsModule, NgForm } from '@angular/forms';

import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { AuthService } from '../../services/auth/auth.service';
import { User } from '../../models/user/user';

@Component({
  selector: 'app-forgotpassword',
  imports: [HeaderComponent, FooterComponent, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotpasswordComponent {
  private readonly authService = inject(AuthService);

  isOverlayActive = false;
  user: User | null = null;
  submitted = false;

  /**
   * Handles the form submission, sends a password reset email and manages loading state.
   * @param emailform The form containing the user's email.
   */
  async onSubmit(emailform: NgForm) {
    this.isOverlayActive = true;
    try {
      await this.authService.sendPasswordReset(this.user!.email);
    } catch {
      // Kein sichtbarer Fehlerzustand im bisherigen UI vorgesehen; still scheitern.
    }
    this.submitted = true;
    emailform.reset();
    setTimeout(() => {
      this.isOverlayActive = false;
      this.submitted = false;
    }, 1500);
  }
}
