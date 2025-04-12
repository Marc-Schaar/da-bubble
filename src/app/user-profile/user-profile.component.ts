import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { getAuth, User, updateProfile } from 'firebase/auth';
import { UserService } from '../shared.service';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {
  newname: string = '';
  @Input() menuTrigger!: MatMenuTrigger;
  @Input() showmodifycontent: boolean = false;

  userService = inject(UserService);
  auth = getAuth();
  user: User | null = null;
  displayName: string | null = null;
  email: string | null = null;
  photoURL: string | null = null;
  emailVerified: boolean = false;
  uid: string | null = null;
  modifyinfos = false;
  selectedUsers: any[] = [];
  constructor(public firestore: Firestore) {}

  ngOnInit() {
    this.user = this.auth.currentUser;
    if (this.user) {
      this.displayName = this.user.displayName;
      this.email = this.user.email;
      this.photoURL = this.user.photoURL;
      this.emailVerified = this.user.emailVerified;
      this.uid = this.user.uid;
    }
  }

  async modify() {
    this.modifyinfos = true;
    this.newname = this.user?.displayName ?? ''; 
  }

  closeMenu() {
    this.showmodifycontent = false;
    this.menuTrigger.closeMenu();
  }

  cancel() {
    this.modifyinfos = false;
  }

  async saveChanges() {
    if (this.user && this.newname) {
      try {
        await updateProfile(this.user, { displayName: this.newname });
        this.displayName = this.newname;
        this.modifyinfos = false;
      } catch (error) {
        console.error('Error updating profile:', error);
      }
    }
  }
}
