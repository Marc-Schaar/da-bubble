import { Component, inject, input } from '@angular/core';
import { MatIcon } from '@angular/material/icon';

import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { UserMenuComponent } from '../../../../shared/components/user-menu/user-menu.component';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-chat-header',
  imports: [MatIcon, ButtonComponent],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  private bottomSheet = inject(MatBottomSheet);
  private navigationService: NavigationService = inject(NavigationService);
  public authService = inject(AuthService);

  /** Set by the thread drawer so back closes the thread instead of navigating away. */
  public isThread = input<boolean>(false);

  /**
   * Navigates back to the channel or to the contact bar — except inside the
   * thread drawer, where it only closes the drawer so the channel/direct
   * chat underneath stays put instead of being replaced by the contact bar.
   */
  public handleBack() {
    if (this.isThread()) {
      this.navigationService.toggleThread('close');
    } else {
      this.navigationService.gotToChat();
    }
  }

  /**
   * Opens the user menu as a bottom sheet.
   */
  public openUserMenu() {
    this.bottomSheet.open(UserMenuComponent);
  }
}
