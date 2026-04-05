import { CommonModule } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';

import { DialogReciverComponent } from '../../../dialogs/dialog-reciver/dialog-reciver.component';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { User } from '../../../app_auth/models/user/user';
import { ChannelService } from '../../services/channel/channel.service';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-add-member',
  imports: [CommonModule, MatIcon, FormsModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss',
})
export class AddMemberComponent {
  public readonly authService: AuthService = inject(AuthService);
  public readonly channelService: ChannelService = inject(ChannelService);
  private readonly dialog = inject(MatDialog);

  public readonly dialogRef = inject(MatDialogRef<AddMemberComponent>);
  public readonly data = inject<any>(MAT_DIALOG_DATA);

  showUserBar: boolean = false;
  addMemberWindow: boolean = false;

  public isSubmiting = signal<boolean>(false);

  constructor() {
    this.channelService.currentChannel.set(this.data);
    this.channelService.allMembersSelected.set(false);
    this.channelService.resetSelection();
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

    if (!channelId || this.channelService.membersToSubmit().length === 0) return;
    this.isSubmiting.set(true);
    try {
      await this.channelService.addMembers(channelId, this.channelService.membersToSubmit());
      this.channelService.resetSelection();
      this.closeDialog();
    } catch (error) {
      console.log(error);
    } finally {
      this.isSubmiting.set(false);
    }
  }

  /**
   * Changes the state to show the add member window.
   */
  changeWindow() {
    this.addMemberWindow = true;
  }

  /**
   * Closes the member addition dialog.
   */
  public closeDialog() {
    this.dialogRef.close();
  }

  /**
   * Opens the user bar for member selection.
   */
  openUserBar() {
    this.showUserBar = true;
  }

  openAddMember() {
    this.addMemberWindow = true;
  }

  public openProfileDialog(userData: User) {
    this.dialog.open(DialogReciverComponent, {
      data: userData,
      width: '400px',
      panelClass: ['center-dialog'],
    });
  }
}
