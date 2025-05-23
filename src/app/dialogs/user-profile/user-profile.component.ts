import { CommonModule } from '@angular/common';
import { Component, inject, Input, OnInit } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { getAuth, User, updateProfile } from 'firebase/auth';
import { UserService } from '../../services/user/shared.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { MatIcon } from '@angular/material/icon';
import { DialogRef } from '@angular/cdk/dialog';
import { MatDialog } from '@angular/material/dialog';
import { AvatarSelectionComponent } from '../avatar-selection/avatar-selection/avatar-selection.component';

@Component({
  selector: 'app-user-profile',
  imports: [CommonModule, FormsModule, MatIcon],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {
  newname: string = '';
  @Input() menuTrigger!: MatMenuTrigger;
  userService = inject(UserService);
  navigationService = inject(NavigationService);
  auth = getAuth();
  private dialogRef = inject(DialogRef);
  private dialog = inject(MatDialog);

  user: User | null = null;
  displayName: string | null = null;
  email: string | null = null;
  photoURL: string | null = null;
  emailVerified: boolean = false;
  uid: string | null = null;
  modifyinfos = false;
  selectedUsers: any[] = [];

  /**
   * Constructor for SomeComponent. Initializes the component with the Firestore service for interacting with the Firestore database.
   *
   * @param firestore - Firestore service instance used to interact with the Firestore database.
   */
  constructor(public firestore: Firestore) {}

  /**
   * Lifecycle hook that is called when the component is initialized.
   * It retrieves the current user information and sets the properties accordingly.
   */
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

  /**
   * Handles a click event, stops propagation if the target is not a menu trigger.
   * @param event - The click event to be handled.
   */
  handleClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('menu-trigger')) {
      return;
    }
    event.stopPropagation();
  }

  /**
   * Enables the modification of user profile information by showing the input field to update the name.
   */
  async modify() {
    this.modifyinfos = true;
    this.newname = this.user?.displayName ?? '';
  }

  /**
   * Closes the Profile Dialog.
   */
  closeMenu() {
    this.dialogRef.close();
  }

  /**
   * Cancels the modification process and hides the input field for editing.
   */
  cancel() {
    this.modifyinfos = false;
  }

  /**
   * Saves changes made to the user's display name by updating the Firebase user profile.
   */
  async saveChanges() {
    if (this.user && this.newname) {
      try {
        await updateProfile(this.user, { displayName: this.newname, photoURL: this.photoURL });
        this.displayName = this.newname;
        this.photoURL = this.photoURL;
        this.modifyinfos = false;
      } catch (error) {}
    }
  }

  /**
   * Opens the Avatar Selection dialog.
   * Passes the current user data to the dialog as input.
   * After the dialog is closed, updates the user's photoURL if a new avatar was selected.
   */
  openAvatarSelection() {
    const dialogRef = this.dialog.open(AvatarSelectionComponent, {
      data: { user: this.user },
      hasBackdrop: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.photoURL = result;
      }
    });
  }
}
