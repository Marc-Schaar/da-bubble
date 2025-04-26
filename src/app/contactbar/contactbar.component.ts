import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, inject, Injectable, Input, OnInit, ViewChild } from '@angular/core';
import { Firestore, onSnapshot } from '@angular/fire/firestore';
import { FireServiceService } from '../fire-service.service';
import { UserService } from '../shared.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { Router } from '@angular/router';
import { AddChannelComponent } from './add-channel/add-channel.component';
import { HeaderComponent } from '../header/header.component';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../service/navigation/navigation.service';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-contactbar',
  standalone: true,
  imports: [CommonModule, AddChannelComponent, HeaderComponent, MatIconModule, FormsModule],
  templateUrl: './contactbar.component.html',
  styleUrl: './contactbar.component.scss',
})
export class ContactbarComponent implements OnInit {
  public channels: any = [];
  public users: any = [];
  active: boolean = false;
  message: boolean = false;

  isMobile: boolean = false;
  barOpen: boolean = true;
  showBackground: boolean = false;

  userService = inject(UserService);
  firestore = inject(Firestore);
  firestoreService = inject(FireServiceService);
  router: Router = inject(Router);

  currentUser: any = [];
  currentlist: any[] = [];
  searchList: any[] = [];
  currentArray: any[] = [];
  currentReceiver: any;
  userID: string = '';
  currentReciever: any;
  currentChannel: any;
  addChannelWindow: boolean = false;
  isClicked: boolean = false;
  isChannel: boolean = false;

  input: string = '';

  navigationService: NavigationService = inject(NavigationService);

  constructor(private dialog: MatDialog) {} // MatDialog injizieren

  async ngOnInit() {
    this.userService.dashboard = true;
    this.userService.login = false;
    await this.loadUsers();
    this.loadChannels();
    this.findCurrentUser();
    this.openDropdown();
  }

  async loadUsers() {
    try {
      this.users = await this.firestoreService.getUsers();
    } catch (error) {
      console.error('Error loading users in component:', error);
    }
  }

  loadChannels() {
    let channelRef = this.firestoreService.getCollectionRef('channels');
    this.channels = [];
    if (channelRef) {
      onSnapshot(channelRef, (colSnap) => {
        this.channels = colSnap.docs.map((colSnap) => ({
          id: colSnap.id,
          ...colSnap.data(),
        }));
      });
    }
  }

  findCurrentUser() {
    if (this.userService.currentUser?.uid) {
      this.userID = this.userService.currentUser.uid;
      this.currentUser = this.users.find((user: any) => this.userID === user.id);
    } else {
      console.log('user wurde nicht richtig geladen');
    }
  }

  openChannel(index: any) {
    this.currentChannel = this.channels[index];
    //   this.userService.getChannel(this.currentChannel, this.currentUser);
  }

  openPersonalChat(index: any) {
    this.currentReceiver = this.users[index];
    //  this.userService.getReciepent(this.currentReceiver, this.currentUser);
  }

  toggleActive() {
    this.active = !this.active;
  }

  toggleMessage() {
    this.message = !this.message;
  }

  isOpen() {
    return this.message === true;
  }

  isActive() {
    return this.active === true;
  }

  openWindow(window: 'direct' | 'channel') {
    // this.navigationService.loadComponent(window);
    window === 'direct' ? this.navigationService.showDirect() : this.navigationService.showChannel();
    this.userService.toggleThread('close');
  }

  openDropdown() {
    if (this.navigationService.channelType === 'channel') {
      this.active = true;
    }
    if (this.navigationService.channelType === 'direct') {
      this.message = true;
    }
  }

  openAddChannel() {
    this.dialog.open(AddChannelComponent, {
      width: '872px',
      maxWidth: '95vw',
    });
  }

  getList() {
    if (this.input.includes('#')) {
      this.isChannel = true;
      this.currentlist = this.channels;
      this.searchInit('channel');
    }
    if (this.input.includes('@')) {
      this.isChannel = false;
      this.currentlist = this.users;
      this.searchInit('user');
    }
    if (this.input === '' || (!this.input.includes('#') && !this.input.includes('@'))) this.isChannel = false;
  }

  searchInit(searchlistType: string) {
    this.input.length > 3 ? this.startSearch(searchlistType) : this.resetSearch();
  }

  startSearch(searchlistType: string) {
    this.searchList = [];
    let modifyedInput = this.input.slice(1).trim();
    this.currentlist.forEach((object) => {
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

  resetInput() {
    this.input = '';
  }

  getReciever(index: number) {
    this.userID = this.currentlist[index].id;
    if (this.isChannel) {
      this.userService.setUrl('channel', this.userID, this.userService.userId);
      //   this.userService.getChannel(this.currentlist[index], this.currentUser);
      //   this.navigationService.loadComponent('channel');
      this.navigationService.showChannel();
    } else {
      this.userService.setUrl('direct', this.userService.userId, this.userID);
      //   this.userService.getReciepent(this.currentlist[index], this.currentUser);
      //  this.navigationService.loadComponent('direct');
      this.navigationService.showDirect();
    }
    this.isClicked = false;
    this.input = '';
  }
}
