import { ChangeDetectionStrategy, Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AvatarSelectionComponent } from '../avatar-selection-dialog/avatar-selection.component';
import { DialogHeaderComponent } from '../dialog-header/dialog-header.component';
import { NavigationService } from '../../services/navigation/navigation.service';
import { AuthService } from '../../../features/auth/services/auth/auth.service';
import { ButtonDirective } from '../button/button.directive';

@Component({
  selector: 'app-user-profile',
  imports: [FormsModule, MatIcon, DialogHeaderComponent, ButtonDirective],
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileComponent {
  @Input() menuTrigger!: MatMenuTrigger;

  protected readonly authService = inject(AuthService);
  protected readonly navigationService = inject(NavigationService);
  private readonly dialogRef = inject(MatDialogRef<UserProfileComponent>);
  private readonly dialog = inject(MatDialog);

  protected readonly user = this.authService.currentUser;

  newName = '';
  modifyInfos = false;
  protected pendingPhotoUrl: string | null = null;

  /**
   * Handles a click event, stops propagation if the target is not a menu trigger.
   * @param event - The click event to be handled.
   */
  handleClick(event: Event) {
    const target = event.target as HTMLElement;
    if (target.classList.contains('menu-trigger')) {
      return;
    }
    event.stopPropagation();
  }

  /**
   * Enables the modification of user profile information by showing the input field to update the name.
   */
  modify() {
    this.modifyInfos = true;
    this.newName = this.user()?.displayName ?? '';
    this.pendingPhotoUrl = this.user()?.photoUrl ?? null;
  }

  /**
   * Closes the Profile Dialog.
   */
  closeMenu() {
    this.dialogRef.close();
  }

  /**
   * Cancels the modification process and hides the input field for editing.
   */
  cancel() {
    this.modifyInfos = false;
    this.pendingPhotoUrl = null;
  }

  /**
   * Saves changes made to the user's display name and avatar via AuthService.
   */
  async saveChanges() {
    const current = this.user();
    if (!current || !this.newName) return;

    await this.authService.updateUserProfile(this.newName, this.pendingPhotoUrl ?? current.photoUrl);
    this.modifyInfos = false;
  }

  /**
   * Opens the Avatar Selection dialog.
   * Passes the current user data to the dialog as input.
   * After the dialog is closed, stages the new avatar for saving.
   */
  openAvatarSelection() {
    const dialogRef = this.dialog.open(AvatarSelectionComponent, {
      data: { user: this.user() },
      hasBackdrop: false,
    });

    dialogRef.afterClosed().subscribe((result) => {
      if (result) {
        this.pendingPhotoUrl = result;
      }
    });
  }
}
