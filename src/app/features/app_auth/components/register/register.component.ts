import { Component, inject, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { UserService } from '../../../../shared/services/user/shared.service';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, MatIcon, RouterLink, ReactiveFormsModule],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent implements OnInit {
  sharedservice = inject(UserService);
  authService: AuthService = inject(AuthService);
  public registerForm = this.authService.createRegisterForm();

  /**
   * Initializes the signup component and sets login status to false.
   */

  ngOnInit(): void {
    this.sharedservice.login = false;
  }

  /**
   * Constructor for initializing the component with Firestore.
   * @param firestore - The Firestore instance to interact with Firestore services.
   */
  constructor() {}

  /**
   * Handles the form submission to create a new user account.
   * @param useraccount - The form containing the user's account details.
   */
  async onSubmit() {
    if (this.registerForm.invalid) this.registerForm.markAllAsTouched();
    // this.sharedservice.setUser(this.user);
    // this.sharedservice.redirectiontoavatarselection();
  }
}
