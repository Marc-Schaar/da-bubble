import { CommonModule } from '@angular/common';
import { Component, ElementRef, EventEmitter, HostListener, inject, Input, Output, ViewChild } from '@angular/core';
import { FireServiceService } from '../../fire-service.service';
import { arrayUnion, doc, updateDoc } from 'firebase/firestore';

@Component({
  selector: 'app-add-member',
  imports: [CommonModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss'
})
export class AddMemberComponent {
  fireService: FireServiceService = inject(FireServiceService);
  @Input() addMemberInfoWindow:boolean = false;
  @Output() addMemberInfoWindowChange = new EventEmitter<boolean>();

  @Input() currentChannel:any = {};
  @Input() currentChannelId: any;
  @Input() addMemberWindow:boolean = false;
  @Output() addMemberWindowChange = new EventEmitter<boolean>();
  @Input() currentUser: any;
  members: any[] = [];
  users: any[] = [];
  showUserBar: boolean = false;
  chooseMember: boolean = false;
  disabled: boolean = true;
  selectedUsers: any[] = [];
  filteredUsers: any[] = [];

  ngOnInit() {
    this.loadMember();
    this.loadUsers();
  }

  filterUsers() {
    let filter = document.getElementById(
      'user-search-bar'
    ) as HTMLInputElement | null;
    if (filter) {
      const filterValue = filter.value.toLowerCase();
      this.filteredUsers = this.users.filter((user) =>
        user.fullname.toLowerCase().includes(filterValue)
      );
    } else {
      this.filteredUsers = this.users;
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
    this.members = this.currentChannel['member']
  }

  closeWindow() {
    this.addMemberInfoWindow = false;
    this.addMemberInfoWindowChange.emit(this.addMemberInfoWindow);    
  }

  @ViewChild('userSearchInput') userSearchInput!: ElementRef;
  @ViewChild('chooseUserBar') chooseUserBar!: ElementRef;

  openUserBar(){
    this.showUserBar = true;
    this.filterUsers();
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
  }

  addUserToSelection(index: number) {
    this.selectedUsers.push(this.filteredUsers[index]);
    this.removeUserFromBar(index);
    this.refreshBar();
    this.checkButton();
  }

  checkButton() {
    if(this.selectedUsers.length > 0) {
      this.disabled = false;
    } else {
      this.disabled = true;

    }
  }

  removeUserFromBar(index: number) {
    this.users.splice(index, 1);
    this.filterUsers();
    console.log(this.users);
    console.log(this.filteredUsers);
  }

  refreshBar() {
    const refresh = document.getElementById(
      'user-search-bar'
    ) as HTMLInputElement | null;
    if (refresh) {
      console.log('refresh');
      refresh.value = '';
    }
  }

  removeSelectedUser(index: number) {
    this.addUserToBar(index);
    this.selectedUsers.splice(index, 1);
    console.log(this.selectedUsers.length);
    
    this.checkButton();
  }

  addUserToBar(index: number) {
    this.users.push(this.selectedUsers[index]);
    this.filterUsers();
    console.log(this.users);
    console.log(this.filteredUsers);
  }

  async addUserToChannel() {
    const channelRef = doc(this.fireService.firestore, "channels", this.currentChannelId);
    try {
      await updateDoc(channelRef, {
        member: arrayUnion(...this.selectedUsers)
      });
  
      console.log("Benutzer erfolgreich hinzugefügt:", this.selectedUsers);
      this.selectedUsers = [];
    } catch (error) {
      console.error("Fehler beim Hinzufügen:", error);
    }
  }
}
