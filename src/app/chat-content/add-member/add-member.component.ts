import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, Inject, HostListener, inject, Input, Output, ViewChild, OnInit } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { FireServiceService } from '../../fire-service.service';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';
import { UserService } from '../../shared.service';
import { BehaviorSubject, Subject } from 'rxjs';

@Component({
  selector: 'app-add-member',
  imports: [CommonModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss',
})
export class AddMemberComponent implements OnInit{
  fireService: FireServiceService = inject(FireServiceService);
  userService = inject(UserService);

  @Input() currentChannel: any = {};
  @Input() currentChannelId: any;
  @Input() showBackground: boolean = true;

  @Input() currentUser: any;
  members: any[] = [];
  users: any[] = [];
  showUserBar: boolean = false;
  chooseMember: boolean = false;
  disabled: boolean = true;
  selectedUsers: any[] = [];
  filteredUsers: any[] = [];
  filteredMembers: any[] = [];
  addMemberWindow: boolean = false;
  // reciepentId: string | null = null;

  constructor(
    public dialogRef: MatDialogRef<AddMemberComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentChannel = data.currentChannel;
    this.currentChannelId = data.currentChannelId;
    this.currentUser = data.currentUser;
    this.addMemberWindow = data.addMemberWindow;
  }

  async ngOnInit() {
    this.loadMember();
    await this.loadUsers();
    this.filterUsers()
    this.filterMembers();
    console.log(this.showUserBar);
    
  }

  filterMembers() {
    this.filteredMembers = this.members
    .filter((member) => this.userService.auth.currentUser && this.userService.auth.currentUser.uid !== member.id)
  }

  filterUsers() {
    let filter = document.getElementById('user-search-bar') as HTMLInputElement | null;
    if (filter) {
      const filterValue = filter.value.toLowerCase();
      this.filteredUsers = this.users
        .filter((user) => user.fullname.toLowerCase().includes(filterValue))
        .filter((user) => !this.members.some((member) => member.uid === user.id))
        .filter((user) => !this.members.some((member) => member.id === user.id))

    } else {
      this.filteredUsers = this.users.filter(
        (user) => !this.selectedUsers.some((selected) => selected.uid === user.id)
      );
    }
  }

  async loadUsers() {
    try {
      this.users = await this.fireService.getUsers();
    } catch (error) {
      console.error('Error loading users in component:', error);
    }
  }

  changeWindow() {
    this.addMemberWindow = true;
  }

  loadMember() {
    this.members = this.currentChannel['member'];
  }

  closeWindow() {
    this.dialogRef.close();
  }

  @ViewChild('userSearchInput') userSearchInput!: ElementRef;
  @ViewChild('chooseUserBar') chooseUserBar!: ElementRef;
  @ViewChild('mainDialog') mainDialog!: ElementRef;

  openUserBar() {
    this.showUserBar = true;
  }

  @HostListener('document:click', ['$event'])
  closeUserBar(event: Event) {
    const targetElement = event.target as Node;

    if (this.showUserBar && !this.chooseUserBar.nativeElement.contains(targetElement)) {
      this.showUserBar = false;
    }
  }

  addUserToSelection(index: number) {
    const selectedUser = this.filteredUsers[index];
    this.selectedUsers.push(selectedUser);
    this.removeUserFromBar(index);
    this.users = this.users.filter((user) => user.id !== selectedUser.id);
    this.refreshBar();
    this.filterUsers();
    this.checkButton();
  }

  checkButton() {
    if (this.selectedUsers.length > 0) {
      this.disabled = false;
    } else {
      this.disabled = true;
    }
  }

  removeUserFromBar(index: number) {
    this.filteredUsers.splice(index, 1);
    console.log(this.users);
    console.log(this.filteredUsers);
  }

  refreshBar() {
    const refresh = document.getElementById('user-search-bar') as HTMLInputElement | null;
    if (refresh) {
      console.log('refresh');
      refresh.value = '';
    }
  }

  removeSelectedUser(index: number) {
    this.addUserToBar(index);
    this.selectedUsers.splice(index, 1);
    this.checkButton();
  }

  addUserToBar(index: number) {
    this.users.push(this.selectedUsers[index]);
    this.filterUsers();
    console.log(this.users);
    console.log(this.filteredUsers);
  }

  async addUserToChannel() {
    const channelRef = doc(this.fireService.firestore, 'channels', this.currentChannelId);
    try {
      await updateDoc(channelRef, {
        member: arrayUnion(...this.selectedUsers),
      });

      console.log('Benutzer erfolgreich hinzugefügt:', this.selectedUsers);
      this.selectedUsers = [];
    } catch (error) {
      console.error('Fehler beim Hinzufügen:', error);
    }
    this.userService.showFeedback("User hinzugefügt");

  }

  showProfile(member: any) {
    this.userService.currentReciever = member;
    this.userService.showRecieverProfile();
    this.closeWindow();
  }

}
