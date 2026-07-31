import { inject, Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { UserProfileComponent } from '../../components/user-profile/user-profile.component';
import { User } from '../../../features/auth/models/user/user';

/**
 * Opens the small profile-card dialog for a user. Used from message
 * authors, direct-chat headers, and channel member lists, which previously
 * each duplicated the same `dialog.open(...)` config. Passing a User as
 * dialog data puts UserProfileComponent into its read-only receiver mode.
 */
@Injectable({
  providedIn: 'root',
})
export class ProfileDialogService {
  private readonly dialog = inject(MatDialog);

  public open(user: User | null | undefined): void {
    if (!user) return;
    this.dialog.open(UserProfileComponent, {
      data: user,
      panelClass: ['center-dialog'],
    });
  }
}
