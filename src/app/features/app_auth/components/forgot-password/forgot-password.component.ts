import { Component, inject, OnInit } from '@angular/core';

import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';

import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { RouterLink } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { UserService } from '../../../../shared/services/user/shared.service';
import { User } from '../../models/user/user';

@Component({
  selector: 'app-forgotpassword',
  imports: [HeaderComponent, FooterComponent, FormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotpasswordComponent {
  isOverlayActive = false;
  user: User | null = null;
  submitted = false;

  auth = getAuth();

  /**
   * Handles the form submission, sends a password reset email and manages loading state.
   * @param emailform The form containing the user's email.
   */
  async onSubmit(emailform: NgForm) {
    this.isOverlayActive = true;
    await sendPasswordResetEmail(this.auth, this.user!.email)
      .then(() => {})
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });
    this.submitted = true;
    emailform.reset();
    setTimeout(() => {
      this.isOverlayActive = false;
      this.submitted = false;
    }, 1500);
  }
}
