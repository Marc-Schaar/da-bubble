import { Component, inject, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { UserService } from '../shared.service';
import { signOut, User } from '@firebase/auth';
import { Auth } from '@angular/fire/auth';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { FireServiceService } from '../fire-service.service';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { onLog } from '@angular/fire/app';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatMenuModule, MatIconModule, MatButtonModule, CommonModule, UserProfileComponent, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @ViewChild(MatMenuTrigger) menuTriggerRef!: MatMenuTrigger;

  displayName: string | null = null;
  user: User | null = null;

  auth = inject(Auth);
  fireService = inject(FireServiceService);
  userService = inject(UserService);
  router: Router = inject(Router);

  showmodifycontent = false;
  isClicked: boolean = false;
  listKey: string = '';
  isChannel: boolean = false;
  isProfileCard: boolean = false;

  opened = 0;

  input: string = '';
  channelType: string = '';
  docId: string = '';
  currentUserId: string = '';
  currentRecieverId: string = '';
  currentChannelId: string = '';

  channels: any[] = [];
  users: any[] = [];
  currentReciever: any = null;
  currentUser: any = null;
  currentChannel: any = null;
  currentlist: any[] = [];
  searchList: any[] = [];
  currentArray: any[] = [];

  show() {
    this.opened++;
    this.showmodifycontent = true;
  }

  showmenu() {
    this.showmodifycontent = false;
  }

  async signOut() {
    const currentUser = this.userService.getUser();
    currentUser.online = false;
    await this.fireService.updateOnlineStatus(currentUser);
    await signOut(this.auth);

    this.userService.redirectiontologinpage();
  }

  async ngOnInit() {
    await this.loadChannels();
    await this.loadUsers();
    this.setCurrentUser();
  }

  async loadUsers() {
    try {
      this.users = await this.fireService.getUsers();
    } catch (error) {
      console.error('Error loading users in component:', error);
    }
  }

  async loadChannels() {
    try {
      this.channels = await this.fireService.getChannels();
    } catch (error) {
      console.error('Error loading channels in component:', error);
    }
  }

  setCurrentUser() {
    this.currentUser = this.userService.user;
    this.currentUserId = this.userService.user.uid;
  }

  getList() {
    if (this.input.includes('#')) {
      this.isChannel = true;
      this.currentlist = this.channels;
      this.isClicked = true;
      this.searchInit('channel');
    }
    if (this.input.includes('@')) {
      this.isChannel = false;
      this.isClicked = true;
      this.currentlist = this.users;
      this.searchInit('user');
    }
    if (this.input === '' || (!this.input.includes('#') && !this.input.includes('@'))) {
      this.isChannel = false;
      this.isClicked = false;
    }
  }

  searchInit(searchlistType: string) {
    this.input.length > 3 ? this.startSearch(searchlistType) : this.resetSearch();
  }

  startSearch(searchlistType: string) {
    this.searchList = [];
    let modifyedInput = this.input.slice(1).trim();
    this.currentlist.forEach((object) => {
      //diese if-abfrage zw Users und channels könnte man sich sparen, wenn users und channels den gleichen key für den namen hätten und die daraus resultierenden zwei funktionen searchInUsers udn searchInChannels!
      if (searchlistType == 'user') this.searchInUsers(object, modifyedInput);
      if (searchlistType === 'channel') this.searchInChannels(object, modifyedInput);
    });
  }

  searchInUsers(object: any, input: string) {
    this.isChannel = false;
    if (object.fullname.toLowerCase().includes(input) || object.email.toLowerCase().includes(input)) {
      const duplette = this.searchList.find((search) => search.id === object.id);
      if (!duplette) {
        this.searchList.push(object);
        this.currentlist = this.searchList;
      }
    }
  }

  searchInChannels(object: any, input: string) {
    this.isChannel = true;
    if (object.name.toLowerCase().includes(input)) {
      const duplette = this.searchList.find((search) => search.id === object.id);
      if (!duplette) {
        this.currentlist.push(object);
        this.searchList.push(object);
        this.currentlist = this.searchList;
      }
    }
  }

  resetSearch() {
    this.searchList = [];
    this.currentReciever = null;
    this.currentChannel = null;
  }

  chooseReciever(index: number) {
    if (this.isChannel === false) {
      this.currentReciever = this.searchList[index];
      this.currentRecieverId = this.currentReciever.id;
      this.input = '@' + this.currentReciever.fullname;
    }
    if (this.isChannel === true) {
      this.currentChannel = this.searchList[index];
      this.currentChannelId = this.currentChannel.id;
      this.input = '#' + this.currentChannel.name;
    }
    this.isChannel = false;
  }

  toggleList(event: Event) {
    this.isClicked = !this.isClicked;
    this.currentlist = this.users;
    this.isChannel = false;
    event.stopPropagation();
  }

  hideList() {
    this.isClicked = false;
  }

  getReciever(index: number) {
    if (this.isChannel) {
      const currentChannel = this.currentlist[index];
      if (this.input === '') {
        this.input = '#' + currentChannel?.name;
      } else {
        this.input = this.input + currentChannel?.name;
      }
    } else {
      const currentReciever = this.currentlist[index];
      if (this.input === '') {
        this.input = '@' + currentReciever?.fullname;
      } else {
        this.input = this.input + currentReciever?.fullname;
      }
    }
  }
}
