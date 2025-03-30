import { CommonModule } from '@angular/common';
import { Component, EventEmitter, inject, Input, Output } from '@angular/core';
import { FireServiceService } from '../../fire-service.service';

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


  openUserBar(){
    this.showUserBar = !this.showUserBar;
    this.filterUsers();
  }

  addUserToSelection(index: number) {
    this.selectedUsers.push(this.filteredUsers[index]);
    this.removeUserFromBar(index);
    this.refreshBar();
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
  }

  addUserToBar(index: number) {
    this.users.push(this.selectedUsers[index]);
    this.filterUsers();
    console.log(this.users);
    console.log(this.filteredUsers);
  }
}
