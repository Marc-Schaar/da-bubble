import { ChangeDetectionStrategy, Component, inject, Input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatMenuTrigger } from '@angular/material/menu';
import { MatIcon } from '@angular/material/icon';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { AvatarSelectionComponent } from '../avatar-selection-dialog/avatar-selection.component';
import { DialogHeaderComponent } from '../dialog-header/dialog-header.component';
import { NavigationService } from '../../services/navigation/navigation.service';
import { AuthService } from '../../../features/auth/services/auth/auth.service';
import { ButtonComponent } from '../button/button.component';
import { InputComponent } from '../input/input.component';
import { User } from '../../../features/auth/models/user/user';
import { NotificationService } from '../../services/notification/notification.service';
import { GuestLockTooltipComponent } from '../guest-lock-tooltip/guest-lock-tooltip.component';

/**
 * Profile dialog for both the logged-in user's own (editable) profile and
 * read-only views of other users. Mode is derived from MAT_DIALOG_DATA: no
 * data → own profile via AuthService; a User payload → read-only view with
 * a "start chat" action.
 */
@Component({
  selector: 'app-user-profile',
  imports: [FormsModule, MatIcon, DialogHeaderComponent, ButtonComponent, InputComponent, GuestLockTooltipComponent],
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
  private readonly notificationService = inject(NotificationService);
  private readonly receiverData = inject<User | null>(MAT_DIALOG_DATA, { optional: true });

  protected readonly isOwnProfile = !this.receiverData;
  protected readonly user = this.isOwnProfile ? this.authService.currentUser : () => this.receiverData;

  newName = signal('');
  modifyInfos = signal(false);
  protected pendingPhotoUrl = signal<string | null>(null);
  protected isSaving = signal(false);
  private avatarDialogRef?: MatDialogRef<AvatarSelectionComponent>;

  constructor() {
    // The avatar-selection dialog opens with hasBackdrop:false so it doesn't
    // double-darken the screen on top of this dialog's own backdrop. That
    // means a backdrop click only reaches this dialog, closing it without
    // ever telling the still-open avatar picker to close — close it here.
    this.dialogRef.afterClosed().subscribe(() => this.avatarDialogRef?.close());
  }

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
    if (this.authService.isGuest()) return;
    this.modifyInfos.set(true);
    this.newName.set(this.user()?.displayName ?? '');
    this.pendingPhotoUrl.set(this.user()?.photoUrl ?? null);
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
    this.modifyInfos.set(false);
    this.pendingPhotoUrl.set(null);
  }

  /**
   * Saves changes made to the user's display name and avatar via AuthService.
   */
  async saveChanges() {
    const current = this.user();
    const newName = this.newName();
    if (!current || !newName) return;

    this.isSaving.set(true);
    try {
      await this.authService.updateUserProfile(newName, this.pendingPhotoUrl() ?? current.photoUrl);
      this.notificationService.success('Profil aktualisiert');
      this.modifyInfos.set(false);
    } finally {
      this.isSaving.set(false);
    }
  }

  /**
   * Opens the Avatar Selection dialog.
   * Passes the current user data to the dialog as input.
   * After the dialog is closed, stages the new avatar for saving.
   */
  openAvatarSelection() {
    this.avatarDialogRef = this.dialog.open(AvatarSelectionComponent, {
      data: { user: this.user() },
      hasBackdrop: false,
    });

    this.avatarDialogRef.afterClosed().subscribe((result) => {
      this.avatarDialogRef = undefined;
      if (result) {
        this.pendingPhotoUrl.set(result);
      }
    });
  }

  /**
   * Opens a direct chat with the profile owner (receiver view only) and closes the dialog.
   */
  openChat() {
    if (!this.receiverData) return;
    this.navigationService.selectDirectMessageRecipient(this.receiverData.id);
    this.closeMenu();
  }
}
