import { Component, inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../../services/navigation/navigation.service';
import { User } from '../../../features/app_auth/models/user/user';

@Component({
  selector: 'app-dialog-receiver',
  imports: [MatIconModule],
  templateUrl: './dialog-receiver.component.html',
  styleUrl: './dialog-receiver.component.scss',
})
export class DialogReceiverComponent {
  public readonly receiverData = inject<User>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DialogReceiverComponent>);
  private readonly navigationService = inject(NavigationService);

  /**
   * Opens a direct chat with the selected receiver.
   *
   * Sets the URL for a direct conversation between the current user and the receiver,
   * shows the direct message view, and closes the user menu.
   */
  public openReceiver() {
    this.navigationService.selectDirectMessageRecipient(this.receiverData.id);
    this.closeMenu();
  }

  /**
   * Closes the menu and emits an event to notify the parent component that the content should be hidden.
   */
  public closeMenu() {
    this.dialogRef.close();
  }
}
