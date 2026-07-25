import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { DialogReceiverComponent } from '../../components/dialog-receiver/dialog-receiver.component';
import { User } from '../../../features/auth/models/user/user';

/**
 * Opens the small profile-card dialog for a user. Used from message
 * authors, direct-chat headers, and channel member lists, which previously
 * each duplicated the same `dialog.open(DialogReceiverComponent, {...})` config.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileDialogService {
  private readonly dialog = inject(MatDialog);

  public open(user: User | null | undefined): void {
    if (!user) return;
    this.dialog.open(DialogReceiverComponent, {
      data: user,
      width: '400px',
      panelClass: ['center-dialog'],
    });
  }
}
