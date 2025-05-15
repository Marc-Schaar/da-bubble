import { Component, inject } from '@angular/core';
import { UserService } from '../../services/user/shared.service';
import { MatIcon } from '@angular/material/icon';
import { RouterLink } from '@angular/router';
import { UserMenuComponent } from '../../dialogs/user-menu/user-menu.component';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

@Component({
  selector: 'app-chat-header',
  imports: [MatIcon, RouterLink],
  templateUrl: './chat-header.component.html',
  styleUrl: './chat-header.component.scss',
})
export class ChatHeaderComponent {
  public userService: UserService = inject(UserService);
  private bottomSheet = inject(MatBottomSheet);

  openUserMenu() {
    this.bottomSheet.open(UserMenuComponent);
  }
}
