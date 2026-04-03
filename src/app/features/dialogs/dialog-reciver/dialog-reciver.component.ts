import { Component, inject, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../../../shared/services/navigation/navigation.service';
import { User } from '../../app_auth/models/user/user';

@Component({
  selector: 'app-dialog-reciver',
  imports: [MatIconModule],
  templateUrl: './dialog-reciver.component.html',
  styleUrl: './dialog-reciver.component.scss',
})
export class DialogReciverComponent implements OnInit {
  public readonly reciverData = inject<User>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DialogReciverComponent>);
  private readonly navigationService = inject(NavigationService);

  ngOnInit(): void {
    console.log(this.reciverData);
  }

  /**
   * Opens a direct chat with the selected receiver.
   *
   * Sets the URL for a direct conversation between the current user and the receiver,
   * shows the direct message view, and closes the user menu.
   */
  public openReciver() {
    this.navigationService.selectDirectMessageRecipient(this.reciverData.id);
    this.closeMenu();
  }

  /**
   * Closes the menu and emits an event to notify the parent component that the content should be hidden.
   */
  public closeMenu() {
    this.dialogRef.close();
  }
}
