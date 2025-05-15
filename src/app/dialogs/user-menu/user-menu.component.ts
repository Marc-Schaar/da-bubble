import { Component, inject } from '@angular/core';
import { AuthService } from '../../services/auth/auth.service';
import { MatDialog } from '@angular/material/dialog';
import { DialogRef } from '@angular/cdk/dialog';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { MatIcon } from '@angular/material/icon';

@Component({
  selector: 'app-user-menu',
  imports: [MatIcon],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
})
export class UserMenuComponent {
  private authService: AuthService = inject(AuthService);
  private dialogRef: DialogRef = inject(DialogRef);
  private dialog = inject(MatDialog);

  /**
   * Opens the user profile in a modal dialog.
   */
  showProfile() {
    this.dialog.open(UserProfileComponent);
  }

  /**
   * Logs out the user and closes the current dialog.
   */
  logOut() {
    this.authService.logOut();
    this.dialogRef.close();
  }
}
