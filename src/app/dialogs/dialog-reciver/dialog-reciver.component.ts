import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { UserService } from '../../services/user/shared.service';
import { NavigationService } from '../../services/navigation/navigation.service';

@Component({
  selector: 'app-dialog-reciver',
  imports: [MatIconModule],
  templateUrl: './dialog-reciver.component.html',
  styleUrl: './dialog-reciver.component.scss',
})
export class DialogReciverComponent {
  public readonly reciverData = inject<{ reciever: any; recieverId: string }>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DialogReciverComponent>);
  private userService = inject(UserService);
  private navigationService = inject(NavigationService);

  /**
   * Closes the menu and emits an event to notify the parent component that the content should be hidden.
   */
  public closeMenu() {
    this.dialogRef.close();
  }

  /**
   * Opens a direct chat with the selected receiver.
   *
   * Sets the URL for a direct conversation between the current user and the receiver,
   * shows the direct message view, and closes the user menu.
   */
  public openReciver() {
    this.userService.setUrl('direct', this.reciverData.recieverId, this.userService.currentUser.id);
    this.navigationService.showDirect();
    this.closeMenu();
  }
}
