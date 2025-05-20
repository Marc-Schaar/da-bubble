import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Inject, HostListener, inject, Input, Output, ViewChild, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { FireServiceService } from '../../services/firebase/fire-service.service';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { UserService } from '../../services/user/shared.service';
import { BehaviorSubject, Subject } from 'rxjs';
import { DialogReciverComponent } from '../../dialogs/dialog-reciver/dialog-reciver.component';

@Component({
  selector: 'app-add-member',
  imports: [CommonModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss',
})
export class AddMemberComponent implements OnInit {
  fireService: FireServiceService = inject(FireServiceService);
  userService = inject(UserService);
  @Input() currentChannel: any = {};
  @Input() currentChannelId: any;
  @Input() showBackground: boolean = true;
  @Input() currentUser: any;
  members: any[] = [];
  currentRecieverId: string | null = null;
  users: any[] = [];

  showUserBar: boolean = false;
  chooseMember: boolean = false;
  disabled: boolean = true;
  selectedUsers: any[] = [];
  filteredUsers: any[] = [];
  filteredMembers: any[] = [];
  addMemberWindow: boolean = false;
  readonly dialog = inject(MatDialog);
  @ViewChild('userSearchInput') userSearchInput!: ElementRef;
  @ViewChild('chooseUserBar') chooseUserBar!: ElementRef;
  @ViewChild('mainDialog') mainDialog!: ElementRef;

  /**
   * Constructor for AddMemberComponent. Initializes the component with data passed
   * from the parent component through MAT_DIALOG_DATA.
   *
   * @param dialogRef - Reference to the dialog for controlling the dialog box.
   * @param data - Data passed into the dialog, contains information like the current channel,
   *               current user, and the state of the addMember window.
   */
  constructor(public dialogRef: MatDialogRef<AddMemberComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {
    this.currentChannel = data.currentChannel;
    this.currentChannelId = data.currentChannelId;
    this.currentUser = data.currentUser;
    this.addMemberWindow = data.addMemberWindow;
  }

  /**
   * Initializes component data, loads users and members, and applies filters.
   */
  async ngOnInit() {
    this.loadMember();
    await this.loadUsers();
    this.filterUsers();
    this.filterMembers();
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
        .filter((user) => !user.isAnonymous);
    } else {
      this.filteredUsers = this.users.filter((user) => !this.selectedUsers.some((selected) => selected.uid === user.id));
    }
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
   * Changes the state to show the add member window.
   */
  changeWindow() {
    this.addMemberWindow = true;
  }

  /**
   * Loads current channel members into local state.
   */
  loadMember() {
    this.members = this.currentChannel['member'];
  }

  /**
   * Closes the member addition dialog.
   */
  closeWindow() {
    this.dialogRef.close();
  }

  /**
   * Opens the user bar for member selection.
   */
  openUserBar() {
    this.showUserBar = true;
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
   * Removes a user from the filtered user list.
   * @param index Index to remove
   */
  removeUserFromBar(index: number) {
    this.filteredUsers.splice(index, 1);
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
   * Adds all selected users to the current channel in Firestore.
   */
  async addUserToChannel() {
    const channelRef = doc(this.fireService.firestore, 'channels', this.currentChannelId);
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
      position: { top: 'calc(50svh - 310px)' },
      panelClass: ['fullscreen'],
    });
  }
  openAddMember() {
    this.addMemberWindow = true;
  }
}
