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
  isFound: boolean = false;

  opened = 0;

  input: string = '';
  message: string = '';
  userID: string = '';
  whichMessage: string = '';
  channelType: string = '';
  docId: string = '';
  currentRecieverId: string = '';
  currentUserId: string = '';
  currentChannelId: string = '';

  public channels: any[] = [];
  public users: any[] = [];
  public currentReciever: any = null;
  public currentUser: any = null;
  public currentChannel: any = null;
  currentlist: any[] = [];
  currentMessages: any[] = [];
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

  getCurrentChat() {
    if (this.input.includes('#')) {
      this.currentArray = this.channels;
      this.searchForReciever('channel');
    } else if (this.input.includes('@')) {
      this.currentArray = this.users;
      this.searchForReciever('user');
    }
  }

  searchForReciever(chat: string) {
    if (this.input.length > 3) {
      this.searchList = [];
      this.isFound = true;
      const INPUT = this.input.slice(1).toLowerCase().trim();
      this.whichMessage = chat;
      this.startSearch(INPUT, chat);
    } else {
      this.resetSearch();
    }
  }

  resetSearch() {
    this.searchList = [];
    this.isFound = false;
    this.isChannel = false;
    this.currentReciever = null;
    this.currentChannel = null;
  }

  startSearch(input: string, chat: string) {
    this.currentArray.forEach((object) => {
      //diese if-abfrage zw Users und channels könnte man sich sparen, wenn users und channels den gleichen key für den namen hätten und die daraus resultierenden zwei funktionen searchInUsers udn searchInChannels!
      if (chat === 'user') {
        this.searchInUsers(object, input);
      }
      if (chat === 'channel') {
        this.searchInChannels(object, input);
      }
    });
  }

  searchInUsers(object: any, input: string) {
    if (object.fullname.toLowerCase().includes(input) || object.email.toLowerCase().includes(input)) {
      const duplette = this.searchList.find((search) => search.id === object.id);
      if (!duplette) {
        this.isChannel = false;
        this.searchList.push(object);
      }
    }
  }

  searchInChannels(object: any, input: string) {
    if (object.name.toLowerCase().includes(input)) {
      const duplette = this.searchList.find((search) => search.id === object.id);
      if (!duplette) {
        this.isChannel = true;
        this.searchList.push(object);
      }
    }
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
    this.isFound = false;
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
    this.isFound = false;
  }

  getList() {
    if (this.message.includes('#')) {
      this.currentlist = this.channels;
      this.isClicked = true;
      this.isChannel = true;
    }
    if (this.message.includes('@')) {
      this.isClicked = true;
      this.currentlist = this.users;
      this.isChannel = false;
    }
    if (this.message === '' || (!this.message.includes('#') && !this.message.includes('@'))) {
      this.isClicked = false;
    }
  }

  getReciever(index: number) {
    if (this.isChannel) {
      const currentChannel = this.currentlist[index];
      if (this.message === '') {
        this.message = '#' + currentChannel?.name;
      } else {
        this.message = this.message + currentChannel?.name;
      }
    } else {
      const currentReciever = this.currentlist[index];
      if (this.message === '') {
        this.message = '@' + currentReciever?.fullname;
      } else {
        this.message = this.message + currentReciever?.fullname;
      }
    }
  }
}
