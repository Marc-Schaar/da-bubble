import { Component, inject, ViewChild } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user/shared.service';
import { Auth } from '@angular/fire/auth';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { FireServiceService } from '../services/firebase/fire-service.service';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../services/navigation/navigation.service';
import { AuthService } from '../services/auth/auth.service';

@Component({
  selector: 'app-header',
  imports: [RouterLink, MatMenuModule, MatIconModule, MatButtonModule, CommonModule, UserProfileComponent, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @ViewChild(MatMenuTrigger) menuTriggerRef!: MatMenuTrigger;
  auth = inject(Auth);
  fireService = inject(FireServiceService);
  userService = inject(UserService);
  router: Router = inject(Router);
  navigationService: NavigationService = inject(NavigationService);
  private authService: AuthService = inject(AuthService);
  showBackground = false;
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
  placeholderText: string = '';
  channels: any[] = [];
  users: any[] = [];
  currentReciever: any = null;
  currentUser: any = null;
  currentChannel: any = null;
  currentlist: any[] = [];
  searchList: any[] = [];
  currentArray: any[] = [];

  /**
   * Increments the `opened` counter and sets `showmodifycontent` to true to display the modification content.
   */
  show() {
    this.opened++;
    this.showmodifycontent = true;
  }

  /**
   * Handles the menu closure and sets the background visibility to false.
   */
  onMenuClosed() {
    this.showBackground = false;
  }

  /**
   * Displays the menu and sets the background visibility to true.
   */
  showmenu() {
    this.showmodifycontent = false;
    this.showBackground = true;
  }

  /**
   * Signs out the current user, updates the online status, and redirects to the login page.
   */
  signOut() {
    this.authService.logOut();
  }

  /**
   * Lifecycle hook that is called when the component is initialized.
   * Loads the channels and users, and sets the current user.
   */
  async ngOnInit() {
    await this.loadChannels();
    await this.loadUsers();
    this.setCurrentUser();
    console.log(this.currentUser);
  }

  /**
   * Loads the users from the Firestore database.
   */
  async loadUsers() {
    try {
      this.users = await this.fireService.getUsers();
    } catch (error) {
      console.error('Error loading users in component:', error);
    }
  }

  /**
   * Loads the channels from the Firestore database.
   */
  async loadChannels() {
    try {
      this.channels = await this.fireService.getChannels();
    } catch (error) {
      console.error('Error loading channels in component:', error);
    }
  }

  /**
   * Sets the current user and stores their ID.
   */
  setCurrentUser() {
    this.currentUser = this.auth.currentUser;
    this.currentUserId = this.auth.currentUser!.uid;
  }

  /**
   * Determines which list (channels or users) should be displayed based on the input.
   */
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

  /**
   * Initializes the search by determining the search list type and starting the search.
   * @param searchlistType The type of the list to search through ('channel' or 'user').
   */
  searchInit(searchlistType: string) {
    this.input.length > 1 ? this.startSearch(searchlistType) : this.resetSearch();
  }

  /**
   * Starts searching through the list based on the input and list type (users or channels).
   * @param searchlistType The type of the list to search through ('channel' or 'user').
   */
  startSearch(searchlistType: string) {
    this.searchList = [];
    let modifyedInput = this.input.slice(1).trim();
    this.currentlist.forEach((object) => {
      //diese if-abfrage zw Users und channels könnte man sich sparen, wenn users und channels den gleichen key für den namen hätten und die daraus resultierenden zwei funktionen searchInUsers udn searchInChannels!
      if (searchlistType == 'user') this.searchInUsers(object, modifyedInput);
      if (searchlistType === 'channel') this.searchInChannels(object, modifyedInput);
    });
  }

  /**
   * Searches through the users and adds matching results to the search list.
   * @param object The user object to search in.
   * @param input The input to search for.
   */
  searchInUsers(object: any, input: string) {
    this.isChannel = false;
    if (object.fullname.toLowerCase().includes(input.toLowerCase()) || object.email.toLowerCase().includes(input.toLowerCase())) {
      const duplette = this.searchList.find((search) => search.id === object.id);
      if (!duplette) {
        this.searchList.push(object);
        this.currentlist = this.searchList;
      }
    }
  }

  /**
   * Searches through the channels and adds matching results to the search list.
   * @param object The channel object to search in.
   * @param input The input to search for.
   */
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

  /**
   * Resets the search results and clears the current receiver and channel.
   */
  resetSearch() {
    this.searchList = [];
    this.currentReciever = null;
    this.currentChannel = null;
  }

  /**
   * Sets the receiver or channel based on the index and updates the URL.
   * @param index The index of the selected item (user or channel).
   */
  getReciever(key: string) {
    if (this.isChannel) {
      this.userService.setUrl('channel', key);
      this.navigationService.showChannel();
    } else if (!this.isChannel) {
      this.userService.setUrl('direct', key, this.currentUserId);
      this.navigationService.showDirect();
    }
    this.isClicked = false;
    this.input = '';
  }
}
