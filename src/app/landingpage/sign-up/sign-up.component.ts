import { Component, inject, OnInit } from '@angular/core';
import { FooterComponent } from '../../shared/footer/footer.component';
import { RouterLink } from '@angular/router';
import { FormsModule, NgForm } from '@angular/forms';
import { Firestore } from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';
import { UserService } from '../../services/user/shared.service';
import { User } from '../../models/user/user';
import { MatIcon } from '@angular/material/icon';
import { HeaderComponent } from '../../shared/header/header.component';

@Component({
  selector: 'app-signup',
  imports: [HeaderComponent, FooterComponent, RouterLink, FormsModule, MatIcon],
  templateUrl: './sign-up.component.html',
  styleUrl: './sign-up.component.scss',
})
export class SignupComponent implements OnInit {
  sharedservice = inject(UserService);
  Auth = inject(Auth);
  user = new User();
  checked = false;

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
  constructor(public firestore: Firestore) {}

  /**
   * Handles the form submission to create a new user account.
   * @param useraccount - The form containing the user's account details.
   */
  async onSubmit(useraccount: NgForm) {
    if (useraccount.valid) {
      this.sharedservice.setUser(this.user);
      this.sharedservice.redirectiontoavatarselection();
      this.checked = false;
    }
  }
}
