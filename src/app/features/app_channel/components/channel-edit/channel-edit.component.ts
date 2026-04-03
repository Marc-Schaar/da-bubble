import { CommonModule } from '@angular/common';
import { Component, inject, ElementRef, ViewChild, Inject, HostListener, effect, computed, signal } from '@angular/core';
import { arrayUnion, doc, getDoc, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

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
  public readonly firestore: Firestore = inject(Firestore);
  private readonly fireService: FireServiceService = inject(FireServiceService);

  public currentChannel = signal<any>(null);

  public channelNameEdit: boolean = false;
  public channelDescriptionEdit: boolean = false;

  public tempName = signal('');
  public tempDescription = signal('');

  public currentUser = this.authService.currentUser() as User;

  public userSearchQuery = signal('');

  selectedUsers: User[] = [];
  showUserBar: boolean = false;
  isAddMemberOpen: boolean = false;
  currentRecieverId: string | null = null;

  @ViewChild('channelEditContainer') channelEditContainer!: ElementRef;
  @ViewChild('addMemberMobileButton') addMemberMobileButton!: ElementRef; // Zugriff auf den Öffnen-Button
  @ViewChild('userSearchInput') userSearchInput!: ElementRef; // Reference to the user search input field

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

  enrichedMembers = computed(() => {
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

  filteredUsers = computed(() => {
    const allUsers = this.fireService.allUsers();
    const members = this.currentChannel().member || [];
    const currentUser = this.authService.currentUser();
    const query = this.userSearchQuery().toLowerCase();

    return allUsers.filter((user) => {
      const isNotMember = !members.some((m: any) => m.id === user.id);
      const isNotMe = user.id !== currentUser?.id;
      const matchesQuery = user.displayName.toLowerCase().includes(query);
      const hasEmail = !!user.email;

      return isNotMember && isNotMe && matchesQuery && hasEmail;
    });
  });

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
    const channelRef = doc(this.firestore, 'channels', this.currentChannel().id);
    try {
      await updateDoc(channelRef, data);
      const field = Object.keys(data)[0] === 'name' ? 'Name' : 'Beschreibung';
      this.userService.showFeedback(`Channel ${field} aktualisiert`);
    } catch (error) {
      console.error('Fehler beim Speichern:', error);
    }
  }

  /**
   * Removes the current user from the channel's member list and updates Firestore.
   */
  async exitChannel() {
    const channelRef = doc(this.firestore, 'channels', this.currentChannel().id);
    const currentUser = this.authService.currentUser();
    try {
      const channelDoc = await getDoc(channelRef);
      const channelData = channelDoc.data();
      if (channelData && currentUser) {
        let updateMember = [...channelData['member']];
        const index = updateMember.findIndex((member) => member.id === currentUser.id);
        if (index !== -1) {
          updateMember.splice(index, 1);
        }
        await updateDoc(channelRef, {
          member: updateMember,
        });
      }
    } catch (error) {}
    this.dialogRef.close();
    this.userService.showFeedback('Channel verlassen');
    this.navigationService.goToNewMessage();
  }

  /**
   * Removes a selected user from the selection list.
   * @param index Index of the selected user
   */
  removeSelectedUser(index: number) {
    this.addUserToBar(index);
    this.selectedUsers.splice(index, 1);
  }

  /**
   * Adds a user back to the bar after removal.
   * @param index Index of the selected user
   */
  addUserToBar(index: number) {
    // this.users.push(this.selectedUsers[index]);
  }

  /**
   * Adds a user to the selection list for the channel.
   * @param index Index of the user in the filtered list
   */
  addUserToSelection(index: number) {
    const selectedUser = this.filteredUsers()[index];
    this.selectedUsers.push(selectedUser);
    this.removeUserFromBar(index);
    // this.users = this.users.filter((user) => user.id !== selectedUser.id);
    this.refreshBar();
  }

  /**
   * Checks if the "Add" button should be enabled.
   */
  isAddUserValid() {
    return this.selectedUsers.length > 0;
  }

  /**
   * Clears the input in the user search bar.
   */
  refreshBar() {
    const refresh = document.getElementById('user-search-bar') as HTMLInputElement | null;
    if (refresh) {
      refresh.value = '';
    }
  }

  /**
   * Removes a user from the filtered user list.
   * @param index Index to remove
   */
  removeUserFromBar(index: number) {
    this.filteredUsers().splice(index, 1);
  }

  toogleAddMemberState() {
    this.isAddMemberOpen = !this.isAddMemberOpen;
  }

  /**
   * Opens the user bar for member selection.
   */
  openUserBar() {
    this.showUserBar = true;
  }

  onSearchInput(event: Event) {
    const input = event.target as HTMLInputElement;
    this.userSearchQuery.set(input.value);
    this.openUserBar();
  }

  /**
   * Adds all selected users to the current channel in Firestore.
   */
  async onSubmit() {
    const channelRef = doc(this.fireService.firestore, 'channels', this.currentChannel().id);
    try {
      await updateDoc(channelRef, {
        member: arrayUnion(...this.selectedUsers),
      });
      this.selectedUsers = [];
    } catch (error) {}
    this.userService.showFeedback('User hinzugefügt');
  }

  /**
   * Shows the profile of a given member.
   * @param member User object
   */
  public showProfile(member: any) {
    this.userService.currentReciever = member;
    this.userService.showRecieverProfile();
    this.dialog.open(DialogReciverComponent, {
      data: {
        reciever: this.userService.currentReciever,
        recieverId: this.currentRecieverId,
      },
      width: '400px',
      panelClass: ['center-dialog'],
    });
  }

  /**
   * Closes the dialog window.
   */
  close() {
    this.dialogRef.close();
  }
}
