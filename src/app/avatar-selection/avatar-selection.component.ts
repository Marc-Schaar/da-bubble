import {
  Component,
  ElementRef,
  inject,
  OnInit,
  ViewChild,
} from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { CommonModule } from '@angular/common';
import { User } from '../models/user';
import {
  createUserWithEmailAndPassword,
  getAuth,
  updateProfile,
} from '@angular/fire/auth';
import { doc, Firestore, setDoc } from '@angular/fire/firestore';
import { RouterModule } from '@angular/router';
import { UserService } from '../shared.service';

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

  ngOnInit(): void {
    this.shareddata.login = false;
  }

  constructor(public firestore: Firestore, private userService: UserService) {
    this.user = this.userService.getUser();
    this.newPassword = this.user.password;
  }

  async selectphoto(profilephoto: string) {
    this.profilephoto = profilephoto;
    this.user.profilephoto = this.profilephoto;
  }

  async login() {
    this.isOverlayActive = true;
    await createUserWithEmailAndPassword(
      this.auth,
      this.user.email,
      this.user.password
    )
      .then((userCredential) => {
        const user = userCredential.user;
        return updateProfile(user, {
          displayName: this.user.fullname,
          photoURL: this.user.profilephoto,
        }).then(() => {
          const userDocRef = doc(this.firestore, `users/${user.uid}`);
          return setDoc(userDocRef, {
            fullname: this.user.fullname,
            email: this.user.email,
            profilephoto: this.user.profilephoto,
            messages: [],
            online: false,
          });
        });
      })
      .then(() => {
        setTimeout(() => {
          this.shareddata.redirectiontologinpage();
        }, 2000);
      })
      .catch((error) => {
        console.log('Error:', error);
        console.log('Email:', this.user.email);
        console.log('Password:', this.user.password);
        this.isOverlayActive = false;
      });
  }
}
