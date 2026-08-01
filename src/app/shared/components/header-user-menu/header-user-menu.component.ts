import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatMenuModule } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { NavigationService } from '../../services/navigation/navigation.service';
import { AuthService } from '../../../features/auth/services/auth/auth.service';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { ButtonComponent } from '../button/button.component';
import { ProfileStatusComponent } from '../profile-status/profile-status.component';

@Component({
  selector: 'app-header-user-menu',
  imports: [MatMenuModule, MatIconModule, ButtonComponent, ProfileStatusComponent],
  templateUrl: './header-user-menu.component.html',
  styleUrl: './header-user-menu.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class HeaderUserMenuComponent {
  public authService: AuthService = inject(AuthService);
  public navigationService: NavigationService = inject(NavigationService);
  private matDialog: MatDialog = inject(MatDialog);
  private bottomSheet = inject(MatBottomSheet);

  /**
   * Opens the User Profile Dialog.
   */
  public showProfile() {
    this.matDialog.open(UserProfileComponent, {
      panelClass: 'user-profile-dialog-bottom-left',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabel: 'Eigenes Profil',
    });
  }

  /**
   * Handles the menu closure and sets the background visibility to false.
   */
  public onMenuClosed() {
    this.matDialog.closeAll();
  }

  /**
   * Opens the mobile menu on mobile devices. On desktop, the click already
   * triggers the mat-menu via [matMenuTriggerFor] on the same element.
   */
  public onOpenMenu() {
    if (this.navigationService.isMobile()) {
      this.bottomSheet.open(UserMenuComponent);
    }
  }

  /**
   * Signs out the current user, updates the online status, and redirects to the login page.
   */
  public signOut() {
    this.authService.logOut();
  }
}
