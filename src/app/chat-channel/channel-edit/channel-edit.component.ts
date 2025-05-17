import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject, ElementRef, ViewChild, Inject, HostListener } from '@angular/core';
import { arrayUnion, collection, doc, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { UserService } from '../../services/user/shared.service';
import { getAuth } from 'firebase/auth';
import { NavigationService } from '../../services/navigation/navigation.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { FireServiceService } from '../../services/firebase/fire-service.service';

@Component({
  selector: 'app-channel-edit',
  imports: [CommonModule],
  templateUrl: './channel-edit.component.html',
  styleUrl: './channel-edit.component.scss',
})
export class ChannelEditComponent {
  userService = inject(UserService);
  navigationService = inject(NavigationService);
  channelnameEdit: boolean = false;
  channeldescriptionEdit: boolean = false;
  users: any[] = [];
  auth = getAuth();
  currentChannel: any = {};
  currentChannelId: any;
  currentUser: any;

  selectedUsers: any[] = [];
  filteredUsers: any[] = [];
  showUserBar: boolean = false;
  isAddMemberOpen: boolean = false;
  disabled: boolean = true;
  members: any[] = [];
  filteredMembers: any[] = [];
  @ViewChild('chooseUserBar') chooseUserBar!: ElementRef;
  fireService: FireServiceService = inject(FireServiceService);

  @ViewChild('mainDialog') mainDialog!: ElementRef;
  @ViewChild('channelEditContainer') channelEditContainer!: ElementRef;

  /**
   * Constructor for ChannelEditComponent. Initializes the component with data passed
   * from the parent component through MAT_DIALOG_DATA.
   *
   * @param firestore - Firestore service instance for interacting with the Firestore database.
   * @param dialogRef - Reference to the dialog for controlling the dialog box.
   * @param data - Data passed into the dialog, contains the current channel, current user, and the channel ID.
   */
  constructor(
    public firestore: Firestore,
    public dialogRef: MatDialogRef<ChannelEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentChannel = data.currentChannel;
    this.currentChannelId = data.currentChannelId;
    this.currentUser = data.currentUser;
  }

  /**
   * Angular lifecycle method called on component initialization.
   * Fetches the list of users from Firestore.
   */
  async ngOnInit() {
    this.fetchUsers();

    this.loadMember();
    await this.loadUsers();
    this.filterUsers();
    this.filterMembers();
  }

  /**
   * Fetches all users from the Firestore 'users' collection.
   */
  async fetchUsers() {
    const usersCollection = collection(this.firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    this.users = usersSnapshot.docs.map((doc) => doc.data());
  }

  /**
   * Toggles the edit mode for channel name or description and saves new data if exiting edit mode.
   * @param content - Either 'editName' or 'editDescription'
   */
  editChannelName(content: string) {
    if (content == 'editName') {
      if (!this.channelnameEdit) {
        this.channelnameEdit = true;
      } else {
        this.channelnameEdit = false;
        this.saveNewChannelData(content);
        this.userService.showFeedback('Channel Name geändert');
      }
    }
    if (content == 'editDescription') {
      if (!this.channeldescriptionEdit) {
        this.channeldescriptionEdit = true;
      } else {
        this.channeldescriptionEdit = false;
        this.saveNewChannelData(content);
        this.userService.showFeedback('Channel Beschreibung geändert');
      }
    }
  }

  /**
   * Saves the new channel name or description to Firestore.
   * @param content - Either 'editName' or 'editDescription'
   */
  async saveNewChannelData(content: string) {
    const newChannelName = document.getElementById('changeNameInput') as HTMLInputElement;
    const newChannelDescription = document.getElementById('changeDescriptionInput') as HTMLInputElement;
    const channelRef = doc(this.firestore, 'channels', this.currentChannelId);
    try {
      if (content == 'editName') {
        const ChannelNameRef = doc(this.firestore, 'channels', this.currentChannelId);
        await updateDoc(channelRef, {
          name: newChannelName.value,
        });
        this.currentChannel.name = newChannelName.value;
      }
      if (content == 'editDescription') {
        const ChannelNameRef = doc(this.firestore, 'channels', this.currentChannelId);
        await updateDoc(channelRef, {
          description: newChannelDescription.value,
        });
        this.currentChannel.description = newChannelDescription.value;
      }
    } catch (error) {}
  }

  /**
   * Dynamically adjusts the height of a textarea based on its scroll height.
   * @param event - The input event triggered by the textarea.
   */
  adjustTextareaHeight(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = `${textarea.scrollHeight}px`;
    if (textarea.value == '') {
      textarea.style.height = `60px`;
    }
  }

  /**
   * Closes the dialog window.
   */
  close() {
    this.dialogRef.close();
  }

  /**
   * Removes the current user from the channel's member list and updates Firestore.
   */
  async exitChannel() {
    const channelRef = doc(this.firestore, 'channels', this.currentChannelId);
    const currentUser = this.userService.auth.currentUser;
    try {
      const channelDoc = await getDoc(channelRef);
      const channelData = channelDoc.data();
      if (channelData && currentUser) {
        let updateMember = [...channelData['member']];
        const index = updateMember.findIndex((member) => member.id === currentUser.uid);
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
    this.navigationService.showNewMessage();
    this.userService.setUrl('newMessage');
  }

  /**
   * Removes a selected user from the selection list.
   * @param index Index of the selected user
   */
  removeSelectedUser(index: number) {
    this.addUserToBar(index);
    this.selectedUsers.splice(index, 1);
    this.checkButton();
  }

  /**
   * Adds a user back to the bar after removal.
   * @param index Index of the selected user
   */
  addUserToBar(index: number) {
    this.users.push(this.selectedUsers[index]);
    this.filterUsers();
  }

  /**
   * Filters available users for display in the search bar.
   */
  filterUsers() {
    let filter = document.getElementById('user-search-bar') as HTMLInputElement | null;
    if (filter) {
      const filterValue = filter.value.toLowerCase();
      this.filteredUsers = this.users
        .filter((user) => user.fullname.toLowerCase().includes(filterValue))
        .filter((user) => !this.members.some((member) => member.uid === user.id))
        .filter((user) => !this.members.some((member) => member.id === user.id))
        .filter((user) => user.id !== this.userService.auth.currentUser?.uid)
        .filter((user) => user.email !== null);
    } else {
      this.filteredUsers = this.users.filter((user) => !this.selectedUsers.some((selected) => selected.uid === user.id));
    }
  }

    /**
   * Adds a user to the selection list for the channel.
   * @param index Index of the user in the filtered list
   */
  addUserToSelection(index: number) {
    const selectedUser = this.filteredUsers[index];
    this.selectedUsers.push(selectedUser);
    this.removeUserFromBar(index);
    this.users = this.users.filter((user) => user.id !== selectedUser.id);
    this.refreshBar();
    this.filterUsers();
    this.checkButton();
  }

    /**
   * Loads current channel members into local state.
   */
  loadMember() {
    this.members = this.currentChannel['member'];
  }

  /**
   * Loads the list of all users from the backend.
   */
  async loadUsers() {
    try {
      this.users = await this.fireService.getUsers();
    } catch (error) {}
  }

  /**
   * Checks if the "Add" button should be enabled.
   */
  checkButton() {
    if (this.selectedUsers.length > 0) {
      this.disabled = false;
    } else {
      this.disabled = true;
    }
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
    this.filteredUsers.splice(index, 1);
  }

  openAddMember() {
    this.isAddMemberOpen = !this.isAddMemberOpen;
  }

  /**
   * Opens the user bar for member selection.
   */
  openUserBar() {
    this.showUserBar = true;
  }

  closeAddMember() {
    this.isAddMemberOpen = false;
  }

  /**
   * Filters current members to exclude the current authenticated user.
   */
  filterMembers() {
    this.filteredMembers = this.members.filter(
      (member) => this.userService.auth.currentUser && this.userService.auth.currentUser.uid !== member.id
    );
  }

    /**
   * Closes the user bar when clicking outside of it.
   * @param event DOM click event
   */
  @HostListener('document:click', ['$event'])
  closeUserBar(event: Event) {
    const targetElement = event.target as Node;

    if (this.showUserBar && this.chooseUserBar?.nativeElement && !this.chooseUserBar.nativeElement.contains(targetElement)) {
      this.showUserBar = false;
    }
  }

   /**
     * Adds all selected users to the current channel in Firestore.
     */
    async addUserToChannel() {
      const channelRef = doc(this.fireService.firestore, 'channels', this.currentChannelId);
      try {
        await updateDoc(channelRef, {
          member: arrayUnion(...this.selectedUsers),
        });
        this.selectedUsers = [];
      } catch (error) {
      }
      this.userService.showFeedback('User hinzugefügt');
    }
}
