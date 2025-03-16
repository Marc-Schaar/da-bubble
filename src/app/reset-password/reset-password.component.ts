import { Component, OnInit, inject } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FooterComponent } from '../footer/footer.component';
import { HeaderComponent } from '../header/header.component';
import { FormsModule, NgForm } from '@angular/forms';
import { User } from '../models/user';
import { CommonModule } from '@angular/common';
import {
  getAuth,
  confirmPasswordReset,
  verifyPasswordResetCode,
} from 'firebase/auth';
import { FirebaseApp } from '@angular/fire/app';
import { UserService } from '../shared.service';

@Component({
  selector: 'app-resetpassword',
  standalone: true,
  imports: [
    HeaderComponent,
    FooterComponent,
    FormsModule,
    CommonModule,
    RouterLink,
  ],
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

  constructor(
    private router: Router,
    private activatedRoute: ActivatedRoute,
    private afApp: FirebaseApp
  ) {}

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

  async onSubmit(emailform: NgForm) {
    if (this.resetCode && this.users.password) {
      this.isOverlayActive = true;
      confirmPasswordReset(this.auth, this.resetCode, this.users.password)
        .then(() => {
          this.router.navigate(['/main']);
        })
        .catch((error) => {});
      emailform.reset();
      setTimeout(() => {
        this.isOverlayActive = false;
      }, 1500);
    }
  }
}
