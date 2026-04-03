import { CommonModule } from '@angular/common';
import { Component, inject, ElementRef, ViewChild, Inject, computed, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { UserService } from '../../../../shared/services/user/shared.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { DialogReciverComponent } from '../../../dialogs/dialog-reciver/dialog-reciver.component';
import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { User } from '../../../app_auth/models/user/user';
import { MatIcon } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-channel-edit',
  imports: [CommonModule, MatIcon, FormsModule],
  templateUrl: './channel-edit.component.html',
  styleUrl: './channel-edit.component.scss',
})
export class ChannelEditComponent {
  private readonly userService = inject(UserService);
  private readonly authService = inject(AuthService);
  private readonly navigationService = inject(NavigationService);
  private readonly dialog = inject(MatDialog);
  private readonly dialogRef: MatDialogRef<ChannelEditComponent> = inject(MatDialogRef<ChannelEditComponent>);
  private readonly fireService: FireServiceService = inject(FireServiceService);

  public currentChannel = signal<any>(null);

  public channelNameEdit: boolean = false;
  public channelDescriptionEdit: boolean = false;

  public tempName = signal('');
  public tempDescription = signal('');

  public currentUser = this.authService.currentUser() as User;

  public userSearchQuery = signal('');

  public selectedUsers = signal<User[]>([]);

  public canSubmit = computed(() => this.selectedUsers().length > 0);
  showUserBar: boolean = false;
  isAddMemberOpen: boolean = false;

  /**
   * Constructor for ChannelEditComponent. Initializes the component with data passed
   * from the parent component through MAT_DIALOG_DATA.
   *
   * @param data - Data passed into the dialog, contains the current channel, current user, and the channel ID.
   */
  constructor(@Inject(MAT_DIALOG_DATA) public data: any) {
    this.currentChannel.set(data.currentChannel);
  }

  /**
   * Angular lifecycle method called on component initialization.
   * Fetches the list of users from Firestore.
   */
  ngOnInit() {
    this.fireService.subAllUsers();
  }

  public enrichedMembers = computed(() => {
    const allUsers = this.fireService.allUsers();
    const channelMembers = this.currentChannel().member || [];

    return channelMembers.map((member: User) => {
      const liveUser = allUsers.find((u) => u.id === member.id);
      if (!liveUser) return member;

      return {
        ...member,
        displayName: liveUser.displayName,
        photoUrl: liveUser.photoUrl,
        online: liveUser.online,
      };
    });
  });

  public filteredUsers = computed(() => {
    const allUsers = this.fireService.allUsers();
    const members = this.currentChannel().member || [];
    const currentUser = this.authService.currentUser();
    const currentSelection = this.selectedUsers();
    const query = this.userSearchQuery().toLowerCase();

    return allUsers.filter((user) => {
      const isNotMember = !members.some((m: any) => m.id === user.id);
      const isNotSelected = !currentSelection.some((u) => u.id === user.id);
      const isNotMe = user.id !== currentUser?.id;
      const matchesQuery = user.displayName.toLowerCase().includes(query);
      const hasEmail = !!user.email;

      return isNotMember && isNotSelected && isNotMe && matchesQuery && hasEmail;
    });
  });

  public addUserToSelection(user: User) {
    this.selectedUsers.update((users) => [...users, user]);
    this.userSearchQuery.set('');
    this.showUserBar = false;
  }

  public onSearchInput(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.userSearchQuery.set(value);
    this.showUserBar = true;
  }

  public async onSubmit() {
    const channelId = this.currentChannel()?.id;
    const userObjectsToAdd = this.selectedUsers().map((user) => ({
      id: user.id,
    }));

    if (!channelId || userObjectsToAdd.length === 0) return;

    try {
      await this.fireService.addChannelMembers(channelId, userObjectsToAdd);

      this.currentChannel.update((channel) => ({
        ...channel,
        member: [...(channel.member || []), ...userObjectsToAdd],
      }));

      this.selectedUsers.set([]);
      this.isAddMemberOpen = false;
      this.userService.showFeedback('User hinzugefügt');
    } catch (error) {
      this.userService.showFeedback('Fehler beim Hinzufügen der User');
    }
  }

  public async onEditChannelName() {
    if (!this.channelNameEdit) {
      this.tempName.set(this.currentChannel()?.name);
      this.channelNameEdit = true;
    } else {
      const cleanedName = this.tempName().trim();
      if (cleanedName.length > 0 && cleanedName !== this.currentChannel().name) {
        this.currentChannel().name = cleanedName;
        await this.saveChannelData({ name: cleanedName });
      }
      this.channelNameEdit = false;
    }
  }

  public async onEditChannelDescription() {
    if (!this.channelDescriptionEdit) {
      this.tempDescription.set(this.currentChannel().description || '');
      this.channelDescriptionEdit = true;
    } else {
      if (this.tempDescription() !== this.currentChannel().description) {
        this.currentChannel().description = this.tempDescription();
        await this.saveChannelData({ description: this.tempDescription() });
      }
      this.channelDescriptionEdit = false;
    }
  }

  private async saveChannelData(data: Partial<{ name: string; description: string }>) {
    const channelId = this.currentChannel()?.id;
    if (!channelId) return;

    try {
      await this.fireService.updateChannelData(channelId, data);
      const field = Object.keys(data)[0] === 'name' ? 'Name' : 'Beschreibung';
      this.userService.showFeedback(`Channel ${field} aktualisiert`);
    } catch (error) {
      this.userService.showFeedback('Fehler beim Speichern');
    }
  }

  public async leaveChannel() {
    const currentUser = this.authService.currentUser();
    const channelId = this.currentChannel()?.id;

    if (currentUser?.id && channelId) {
      try {
        await this.fireService.leaveChannel(channelId, currentUser.id);
        this.dialogRef.close();
        this.userService.showFeedback('Channel verlassen');
        this.navigationService.goToNewMessage();
      } catch (error) {
        this.userService.showFeedback('Fehler beim Verlassen des Channels');
      }
    }
  }

  /**
   * Removes a selected user from the selection list.
   * @param index Index of the selected user
   */
  public removeSelectedUser(index: number) {
    this.selectedUsers.update((users) => users.filter((_, i) => i !== index));
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
    this.userSearchQuery.set('');
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
