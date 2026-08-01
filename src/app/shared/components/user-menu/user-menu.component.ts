import { ChangeDetectionStrategy, Component, inject } from '@angular/core';

import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../../features/auth/services/auth/auth.service';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-user-menu',
  imports: [MatIcon, ButtonComponent],
  templateUrl: './user-menu.component.html',
  styleUrl: './user-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserMenuComponent {
  private authService: AuthService = inject(AuthService);
  private bottomSheetRef = inject(MatBottomSheetRef<UserMenuComponent>);
  private dialog = inject(MatDialog);

  /**
   * Opens the user profile in a modal dialog.
   */
  showProfile() {
    this.dialog.open(UserProfileComponent, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabel: 'Eigenes Profil',
    });
  }

  /**
   * Logs out the user and closes the current dialog.
   */
  logOut() {
    this.authService.logOut();
    this.bottomSheetRef.dismiss();
  }
}
