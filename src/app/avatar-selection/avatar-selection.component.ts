import { Component, ElementRef, inject, OnInit, ViewChild } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { User } from '../models/user/user';
import { getAuth } from '@angular/fire/auth';
import { Firestore } from '@angular/fire/firestore';
import { RouterModule } from '@angular/router';
import { UserService } from '../services/user/shared.service';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-avatarselection',
  imports: [HeaderComponent, FooterComponent, CommonModule, RouterModule],
  templateUrl: './avatar-selection.component.html',
  styleUrls: ['./avatar-selection.component.scss'],
})
export class AvatarselectionComponent implements OnInit {
  shareddata = inject(UserService);
  auth = getAuth();
  user: User;
  isOverlayActive = false;
  profilephoto = 'img/profilephoto.png';
  currentUser = this.auth.currentUser;
  newPassword: string;
  @ViewChild('loginbutton') loginbutton!: ElementRef<HTMLButtonElement>;

  /**
   * Initializes component state on load.
   */
  ngOnInit(): void {
    this.shareddata.login = false;
  }

  /**
   * Creates an instance of the component and sets user data.
   * @param firestore Firestore service instance
   * @param userService Service for retrieving user data
   */
  constructor(public firestore: Firestore, private userService: UserService, private authService: AuthService) {
    this.user = this.userService.getUser();
    this.newPassword = this.user.password;
  }

  /**
   * Sets the selected profile photo.
   * @param profilephoto Path to the selected photo
   */
  async selectphoto(profilephoto: string) {
    this.profilephoto = profilephoto;
    this.user.profilephoto = this.profilephoto;
  }

  /**
   * Registers the user, updates their profile and Firestore, and redirects to the login page.
   */
  async login() {
    this.isOverlayActive = true;
    try {
      await this.authService.register(this.user);
      setTimeout(() => {
        this.shareddata.redirectiontologinpage();
      }, 2000);
    } catch (error) {
      console.error('Fehler beim Registrieren:', error);
      this.isOverlayActive = false;
    }
  }
}
