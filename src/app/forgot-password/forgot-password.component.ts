import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { FormsModule, NgForm } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { User } from '../models/user/user';
import { getAuth, sendPasswordResetEmail } from 'firebase/auth';
import { RouterLink } from '@angular/router';
import { UserService } from '../services/user/shared.service';

@Component({
  selector: 'app-forgotpassword',
  imports: [HeaderComponent, FooterComponent, FormsModule, CommonModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotpasswordComponent implements OnInit {
  isOverlayActive = false;
  user = new User();
  submitted = false;
  shareddata = inject(UserService);
  auth = getAuth();

  /**
   * Lifecycle hook that is called when the component is initialized.
   */
  ngOnInit(): void {
    this.shareddata.login = false;
  }

  /**
   * Handles the form submission, sends a password reset email and manages loading state.
   * @param emailform The form containing the user's email.
   */
  async onSubmit(emailform: NgForm) {
    this.isOverlayActive = true;
    await sendPasswordResetEmail(this.auth, this.user.email)
      .then(() => {
        console.info('send');
      })
      .catch((error) => {
        const errorCode = error.code;
        const errorMessage = error.message;
      });
    this.submitted = true;
    emailform.reset();
    setTimeout(() => {
      this.isOverlayActive = false;
      this.submitted = false;
      this.shareddata.redirectiontologinpage();
    }, 1500);
  }
}
