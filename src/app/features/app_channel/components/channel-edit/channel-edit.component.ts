import { CommonModule } from '@angular/common';
import { Component, inject, Inject, computed, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../../shared/services/user/shared.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { DialogReciverComponent } from '../../../dialogs/dialog-reciver/dialog-reciver.component';
import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { User } from '../../../app_auth/models/user/user';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { ChannelService } from '../../services/channel/channel.service';

@Component({
  selector: 'app-channel-edit',
  imports: [CommonModule, MatIcon, FormsModule],
  templateUrl: './channel-edit.component.html',
  styleUrl: './channel-edit.component.scss',
})
export class ChannelEditComponent {
  private readonly userService = inject(UserService);
  private readonly navigationService = inject(NavigationService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef: MatDialogRef<ChannelEditComponent> = inject(MatDialogRef<ChannelEditComponent>);
  public readonly channelService = inject(ChannelService);

  public channelNameEdit: boolean = false;
  public channelDescriptionEdit: boolean = false;
  public tempName = signal('');
  public tempDescription = signal('');
  public isAddMemberOpen: boolean = false;
  public showUserBar: boolean = false;

  public canSubmit = computed(() => this.channelService.selectedUsers().length > 0);

  /**
   * Constructor for ChannelEditComponent. Initializes the component with data passed
   * from the parent component through MAT_DIALOG_DATA.
   *
   * @param data - Data passed into the dialog, contains the current channel, current user, and the channel ID.
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.channelService.currentChannel.set(data.currentChannel);
  }

  public addUserToSelection(user: User) {
    this.channelService.selectedUsers.update((users) => [...users, user]);
    this.channelService.userSearchQuery.set('');
    this.showUserBar = false;
  }

  public onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.channelService.userSearchQuery.set(value);
    this.showUserBar = true;
  }

  public async onSubmit() {
    const channelId = this.channelService.currentChannel()?.id;
    const usersToAdd = this.channelService.selectedUsers().map((u) => ({ id: u.id }));

    if (!channelId || usersToAdd.length === 0) return;

    try {
      await this.channelService.addMembers(channelId, usersToAdd);

      this.channelService.selectedUsers.set([]);
      this.isAddMemberOpen = false;
      this.userService.showFeedback('User hinzugefügt');
    } catch (error) {
      this.userService.showFeedback('Fehler beim Hinzufügen');
    }
  }

  public async onEditChannelName() {
    const channel = this.channelService.currentChannel();
    if (!this.channelNameEdit) {
      this.tempName.set(channel?.name);
      this.channelNameEdit = true;
    } else {
      const cleanedName = this.tempName().trim();
      if (cleanedName && cleanedName !== channel.name) {
        try {
          await this.channelService.updateName(channel.id, cleanedName);
          this.userService.showFeedback('Name aktualisiert');
        } catch (e) {
          this.userService.showFeedback('Fehler beim Speichern');
        }
      }
      this.channelNameEdit = false;
    }
  }

  public async onEditChannelDescription() {
    const channel = this.channelService.currentChannel();
    if (!this.channelDescriptionEdit) {
      this.tempDescription.set(channel.description || '');
      this.channelDescriptionEdit = true;
    } else {
      if (this.tempDescription() !== channel.description) {
        try {
          await this.channelService.updateDescription(channel.id, this.tempDescription());
          this.userService.showFeedback('Beschreibung aktualisiert');
        } catch (e) {}
      }
      this.channelDescriptionEdit = false;
    }
  }

  public async leaveChannel() {
    try {
      await this.channelService.leaveChannel();
      this.dialogRef.close();
      this.userService.showFeedback('Channel verlassen');
      this.navigationService.goToNewMessage();
    } catch (error) {
      this.userService.showFeedback('Fehler beim Verlassen des Channels');
    }
  }

  /**
   * Removes a selected user from the selection list.
   * @param index Index of the selected user
   */
  public removeSelectedUser(index: number) {
    this.channelService.selectedUsers.update((users) => users.filter((_, i) => i !== index));
  }

  public toogleAddMemberState() {
    this.isAddMemberOpen = !this.isAddMemberOpen;
  }

  /**
   * Opens the user bar for member selection.
   */
  public openUserBar() {
    this.showUserBar = true;
  }

  public closeUserBar() {
    this.showUserBar = false;
    this.channelService.userSearchQuery.set('');
  }

  /**
   * Shows the profile of a given member.
   * @param member User object
   */
  public openProfileDialog(userData: User) {
    this.dialog.open(DialogReciverComponent, {
      data: userData,
      width: '400px',
      panelClass: ['center-dialog'],
    });
    this.closeDialog();
  }

  /**
   * Closes the dialog window.
   */
  public closeDialog() {
    this.dialogRef.close();
  }
}
