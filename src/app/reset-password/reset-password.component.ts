import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FooterComponent } from '../shared/footer/footer.component';
import { FormsModule, NgForm } from '@angular/forms';
import { User } from '../models/user/user';
import { CommonModule } from '@angular/common';
import { getAuth, confirmPasswordReset, verifyPasswordResetCode } from 'firebase/auth';
import { FirebaseApp } from '@angular/fire/app';
import { UserService } from '../services/user/shared.service';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
  selector: 'app-resetpassword',
  standalone: true,
  imports: [HeaderComponent, FooterComponent, FormsModule, CommonModule, RouterLink],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetpasswordComponent implements OnInit {
  shared = inject(UserService);
  isOverlayActive = false;
  users = new User();
  auth: any;
  email: string | null = null;
  resetCode = '';

  /**
   * Constructor for SomeComponent. Initializes the component with the Router, ActivatedRoute, and FirebaseApp services.
   *
   * @param router - Router service instance used to navigate between views or routes in the application.
   * @param activatedRoute - ActivatedRoute service instance used to access information about the current route.
   * @param afApp - FirebaseApp service instance used to interact with Firebase services.
   */
  constructor(private router: Router, private activatedRoute: ActivatedRoute, private afApp: FirebaseApp) {}

  /**
   * @description - Lifecycle hook that initializes the component and verifies the reset code from the URL.
   */
  ngOnInit() {
    this.auth = getAuth(this.afApp);
    this.activatedRoute.queryParams.subscribe((params) => {
      this.resetCode = params['oobCode'] || '';
    });
    verifyPasswordResetCode(this.auth, this.resetCode)
      .then((email) => {
        this.email = email;
      })
      .catch((error) => {});
  }

  /**
   * @description - Submits the new password and confirms the reset code.
   * @param emailform - The form containing the user's password input.
   */
  async onSubmit(emailform: NgForm) {
    if (this.resetCode && this.users.password) {
      this.isOverlayActive = true;
      confirmPasswordReset(this.auth, this.resetCode, this.users.password)
        .then(() => {
          this.router.navigate(['/']);
        })
        .catch((error) => {});
      emailform.reset();
      setTimeout(() => {
        this.isOverlayActive = false;
      }, 1500);
    }
  }
}
