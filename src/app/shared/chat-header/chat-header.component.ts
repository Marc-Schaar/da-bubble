import { Component, inject } from '@angular/core';
import { UserService } from '../../services/user/shared.service';
import { MatIcon } from '@angular/material/icon';
import { UserMenuComponent } from '../../dialogs/user-menu/user-menu.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { NavigationService } from '../../services/navigation/navigation.service';

@Component({
  selector: 'app-chat-header',
  imports: [MatIcon],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  public userService: UserService = inject(UserService);
  private bottomSheet = inject(MatBottomSheet);
  private navigationService: NavigationService = inject(NavigationService);

  /**
   *Navigate Back to the Channel or to the Contactbar.
   */
  public handleBack() {
    if (this.navigationService.channelType === 'thread') {
      this.navigationService.channelType = 'channel';
      this.navigationService.showChannel();
    } else this.navigationService.showContactbar();
  }

  /**
   * Opens the user menu as a bottom sheet.
   */
  public openUserMenu() {
    this.bottomSheet.open(UserMenuComponent);
  }
}
