import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { UserService } from '../services/user/shared.service';
import { FireServiceService } from '../services/firebase/fire-service.service';
import { Firestore, arrayUnion, doc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Message } from '../models/message/message';
import { DirectMessage } from '../models/direct-message/direct-message';
import { NavigationService } from '../services/navigation/navigation.service';
import { MessagesService } from '../services/messages/messages.service';
import { TextareaTemplateComponent } from '../shared/textarea/textarea-template.component';
import { MatIconModule } from '@angular/material/icon';
@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-newmessage',
  imports: [CommonModule, FormsModule, TextareaTemplateComponent, MatIconModule, RouterLink],
  templateUrl: './newmessage.component.html',
  styleUrl: './newmessage.component.scss',
})
export class NewmessageComponent {
  userService = inject(UserService);
  firestoreService = inject(FireServiceService);
  router: Router = inject(Router);
  navigationService: NavigationService = inject(NavigationService);
  messageService: MessagesService = inject(MessagesService);
  public channels: any[] = [];
  public users: any[] = [];
  public currentReciever: any = null;
  public currentUser: any = null;
  public currentChannel: any = null;
  currentList: any[] = [];
  message: string = '';
  input: string = '';
  userID: string = '';
  currentMessages: any[] = [];
  firestore = inject(Firestore);
  searchList: any[] = [];
  currentArray: any[] = [];
  isClicked: boolean = false;
  listKey: string = '';
  isChannel: boolean = false;
  isProfileCard: boolean = false;
  whichMessage: string = '';
  channelType: string = '';
  docId: string = '';
  currentRecieverId: string = '';
  currentUserId: string = '';
  currentChannelId: string = '';
  isFound: boolean = false;

  /**
   * ngOnInit lifecycle hook to load channels, users and set the current user.
   */
  async ngOnInit() {
    if (!this.navigationService.isInitialize) {
      this.navigationService.initialize();
    }
    await this.loadChannels();
    await this.loadUsers();
    this.setCurrentUser();
  }

  /**
   * Loads users from the Firestore service.
   */
  async loadUsers() {
    try {
      this.users = await this.firestoreService.getUsers();
    } catch (error) {
      console.error('Error loading users in component:', error);
    }
  }

  /**
   * Loads channels from the Firestore service.
   */
  async loadChannels() {
    try {
      this.channels = await this.firestoreService.getChannels();
    } catch (error) {
      console.error('Error loading channels in component:', error);
    }
  }

  /**
   * Sets the current user based on the UserService.
   */
  setCurrentUser() {
    this.currentUser = this.userService.currentUser;
    this.currentUserId = this.userService.currentUser.uid;

    if (!this.currentUser) {
      console.error('currentUser ist nicht definiert!');
      return;
    }
  }

  /**
   * Sends a direct message to a recipient.
   */
  async sendDirectMessage() {
    const message = new DirectMessage({
      name: this.userService.currentUser?.displayName || '',
      photo: this.userService.currentUser?.photoURL || '',
      content: this.input,
      from: this.currentUserId,
      to: this.currentRecieverId,
    });
    const messageData = this.createMessageData(message);
    const currentUserRef = doc(this.firestore, `users/${this.currentUserId}`);
    const currentReceiverRef = doc(this.firestore, `users/${this.currentRecieverId}`);
    if (this.currentRecieverId !== this.currentUserId) {
      await updateDoc(currentReceiverRef, {
        messages: arrayUnion(messageData),
      });
    }
    await updateDoc(currentUserRef, { messages: arrayUnion(messageData) });
    this.message = '';
    this.input = '';
  }

  /**
   * Creates message data from the DirectMessage object.
   * @param message The DirectMessage object.
   * @returns A plain object containing message data.
   */
  createMessageData(message: DirectMessage) {
    return {
      name: message.name,
      // photo: message.photo,
      // content: message.content,
      // time: message.time.toISOString(),
      // from: message.from,
      // to: message.to,
    };
  }

  /**
   * Sends a message to a channel.
   */
  sendChannelMessage() {
    this.firestoreService.sendMessage(this.currentChannelId, new Message(this.messageService.buildChannelMessageObject(this.input)));
  }

  /**
   * Determines the current chat type based on the message input and searches for a receiver.
   */
  getCurrentChat() {
    if (this.input.includes('#')) {
      this.currentArray = this.channels;
      this.searchForReciever('channel');
    } else if (this.input.includes('@')) {
      this.currentArray = this.users;
      this.searchForReciever('user');
    }
  }

  /**
   * Searches for a receiver based on the input text.
   * @param chat Type of chat (either 'user' or 'channel').
   */
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

  /**
   * Resets the search list and flags.
   */
  resetSearch() {
    this.searchList = [];
    this.isFound = false;
    this.isChannel = false;
    this.currentReciever = null;
    this.currentChannel = null;
  }

  /**
   * Starts the search for the receiver.
   * @param input Search query.
   * @param chat Type of chat (either 'user' or 'channel').
   */
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

  /**
   * Searches for users that match the input.
   * @param object User object.
   * @param input Search query.
   */
  searchInUsers(object: any, input: string) {
    if (object.fullname.toLowerCase().includes(input) || object.email.toLowerCase().includes(input)) {
      const duplette = this.searchList.find((search) => search.id === object.id);
      if (!duplette) {
        this.isChannel = false;
        this.searchList.push(object);
      }
    }
  }

  /**
   * Searches for channels that match the input.
   * @param object Channel object.
   * @param input Search query.
   */
  searchInChannels(object: any, input: string) {
    if (object.name.toLowerCase().includes(input)) {
      const duplette = this.searchList.find((search) => search.id === object.id);
      if (!duplette) {
        this.isChannel = true;
        this.searchList.push(object);
      }
    }
  }

  /**
   * Chooses a receiver from the search results.
   * @param index Index of the selected receiver.
   */
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

  /**
   * Sends a message to the selected receiver or channel.
   */
  async sendMessage() {
    if (this.message === '' || !this.currentRecieverId || !this.currentUserId) {
      return;
    } else if (this.whichMessage === 'user') {
      await this.sendDirectMessage();
      this.userService.setUrl('direct', this.currentRecieverId, this.currentUserId);
    } else if (this.whichMessage === 'channel') {
      this.sendChannelMessage();
      this.userService.setUrl('channel', this.currentChannelId);
    }
    this.currentReciever = null;
    this.currentChannel = null;
  }

  /**
   * Toggles the user/channel list visibility.
   * @param event Event object.
   */
  toggleList(event: Event) {
    this.isClicked = !this.isClicked;
    this.currentList = this.users;
    this.isChannel = false;
    event.stopPropagation();
  }

  /**
   * Hides the user/channel list.
   */
  hideList() {
    this.isClicked = false;
    this.isFound = false;
  }

  /**
   * Displays the list of users or channels based on the message input.
   */
  getList() {
    if (this.message.includes('#')) {
      this.currentList = this.channels;
      this.isClicked = true;
      this.isChannel = true;
    }
    if (this.message.includes('@')) {
      this.isClicked = true;
      this.currentList = this.users;
      this.isChannel = false;
    }
    if (this.message === '' || (!this.message.includes('#') && !this.message.includes('@'))) {
      this.isClicked = false;
    }
  }

  /**
   * Sets the message input to the selected receiver or channel.
   * @param index Index of the selected receiver or channel.
   */
  getReciever(index: number) {
    if (this.isChannel) {
      const currentChannel = this.currentList[index];
      if (this.message === '') {
        this.message = '#' + currentChannel?.name;
      } else {
        this.message = this.message + currentChannel?.name;
      }
    } else {
      const currentReciever = this.currentList[index];
      if (this.message === '') {
        this.message = '@' + currentReciever?.fullname;
      } else {
        this.message = this.message + currentReciever?.fullname;
      }
    }
  }
}
