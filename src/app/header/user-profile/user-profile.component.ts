import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, OnInit, Output } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { getAuth, User, updateProfile } from 'firebase/auth';
import { UserService } from '../../shared.service';

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

  @Output() showmodifycontentChange = new EventEmitter<boolean>();

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

  handleClick(event: Event) {
    const target = event.target as HTMLElement;
    if(target.classList.contains('menu-trigger')) {
      return
    }
    event.stopPropagation();
    console.log("handleClick");
    
  }

  async modify() {
    this.modifyinfos = true;
    this.newname = this.user?.displayName ?? ''; 
  }

  closeMenu() {
    if (this.menuTrigger) {
      this.menuTrigger.closeMenu();
      this.showmodifycontentChange.emit(false);

    } else {
      console.error('menuTrigger ist nicht definiert.');
    }
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
