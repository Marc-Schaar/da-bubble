import { Component, inject } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { UserService } from '../../../../shared/services/user/shared.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { UserMenuComponent } from '../../../dialogs/user-menu/user-menu.component';
import { AuthService } from '../../../app_auth/services/auth/auth.service';

@Component({
  selector: 'app-chat-header',
  imports: [MatIcon],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  private bottomSheet = inject(MatBottomSheet);
  private navigationService: NavigationService = inject(NavigationService);
  public authService = inject(AuthService);

  /**
   *Navigate Back to the Channel or to the Contactbar.
   */
  public handleBack() {
    this.navigationService.gotToChat();
  }

  /**
   * Opens the user menu as a bottom sheet.
   */
  public openUserMenu() {
    this.bottomSheet.open(UserMenuComponent);
  }
}
