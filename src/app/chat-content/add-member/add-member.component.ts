import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
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
export class AddMemberComponent {
  fireService: FireServiceService = inject(FireServiceService);
  userService = inject(UserService);
  @Input() addMemberInfoWindow: boolean = false;
  @Output() addMemberInfoWindowChange = new EventEmitter<boolean>();

  @Input() currentChannel: any = {};
  @Input() currentChannelId: any;
  @Input() addMemberWindow: boolean = false;
  @Output() addMemberWindowChange = new EventEmitter<boolean>();
  @Input() currentUser: any;
  members: any[] = [];
  users: any[] = [];
  showUserBar: boolean = false;
  chooseMember: boolean = false;
  disabled: boolean = true;
  selectedUsers: any[] = [];
  filteredUsers: any[] = [];
  filteredMembers: any[] = [];
  // reciepentId: string | null = null;

  async ngOnInit() {
    this.loadMember();
    await this.loadUsers();
    this.filterUsers()
    this.filterMembers();
    console.log("currentUser", this.userService.auth.currentUser);

    console.log("filteredMembers", this.filteredMembers);

    console.log("users", this.users);
    console.log("member", this.members);
    console.log("filteredUser", this.filteredUsers);
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
    console.log(this.userService.currentReciever);
  }

  changeWindow() {
    this.addMemberWindow = true;
  }

  loadMember() {
    this.members = this.currentChannel['member'];
  }

  closeWindow() {
    this.addMemberInfoWindow = false;
    this.addMemberInfoWindowChange.emit(this.addMemberInfoWindow);
  }

  @ViewChild('userSearchInput') userSearchInput!: ElementRef;
  @ViewChild('chooseUserBar') chooseUserBar!: ElementRef;
  @ViewChild('mainDialog') mainDialog!: ElementRef;

  openUserBar() {
    this.showUserBar = true;
  }

  @HostListener('document:click', ['$event'])
  closeUserBar(event: Event) {
    if (
      this.userSearchInput &&
      this.chooseUserBar &&
      !this.userSearchInput.nativeElement.contains(event.target) &&
      !this.chooseUserBar.nativeElement.contains(event.target)
    ) {
      this.showUserBar = false;
    }
    const targetElement = event.target as HTMLElement;
    if (!this.mainDialog.nativeElement.contains(targetElement)) {
      this.closeWindow();
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
  }

  showProfile(member: any) {
    this.userService.currentReciever = member;
    this.userService.showRecieverProfile();
    console.log(member);
    
  }

}
