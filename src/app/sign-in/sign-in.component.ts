import { Component, inject, OnInit } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatDividerModule } from '@angular/material/divider';
import {
  GoogleAuthProvider,
  Auth,
  onAuthStateChanged,
} from '@angular/fire/auth';
import {
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from '@firebase/auth';
import { FormsModule } from '@angular/forms';
import { FireServiceService } from '../fire-service.service';
import { Firestore } from '@angular/fire/firestore';
import { ChatServiceService } from '../chat-service.service';
import { User } from '../../models/user';

@Component({
  selector: 'app-sign-in',
  imports: [RouterLink, MatDividerModule, FormsModule],
  templateUrl: './sign-in.component.html',
  styleUrl: './sign-in.component.scss',
})
export class SignInComponent implements OnInit {
  disabled = true;
  googleAuthProvider = new GoogleAuthProvider();
  shareddata = inject(ChatServiceService);
  auth = inject(Auth);
  firestore = inject(Firestore);
  fireService = inject(FireServiceService);
  user: User = new User();

  ngOnInit(): void {
    this.shareddata.login = true;
  }

  async signin() {
    try {
      await signInWithEmailAndPassword(
        this.auth,
        this.user.email,
        this.user.password
      );
      await this.setOnlineStatus();
      this.shareddata.redirectiontodashboard();
    } catch (error) {}
  }

  async signinwithgoogle() {
    try {
      await signInWithPopup(this.auth, this.googleAuthProvider);
      await this.setOnlineStatus();
      this.shareddata.redirectiontodashboard();
    } catch (error) {}
  }

  async setOnlineStatus() {
    const currentUser = this.shareddata.getUser();
    currentUser.online = true;
    await this.fireService.updateOnlineStatus(currentUser);
  }
}
