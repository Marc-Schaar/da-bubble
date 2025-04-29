import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { UserService } from '../shared.service';
import { FireServiceService } from '../fire-service.service';
import { Firestore, arrayUnion, doc, updateDoc, serverTimestamp } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Message } from '../models/message/message';
import { DirectMessage } from '../models/direct-message/direct-message';
import { NavigationService } from '../service/navigation/navigation.service';
import { MessagesService } from '../service/messages/messages.service';
@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-newmessage',
  imports: [CommonModule, FormsModule],
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
  constructor() {}

  async ngOnInit() {
    await this.loadChannels();
    await this.loadUsers();
    this.setCurrentUser();
  }

  async loadUsers() {
    try {
      this.users = await this.firestoreService.getUsers();
    } catch (error) {
      console.error('Error loading users in component:', error);
    }
  }

  async loadChannels() {
    try {
      this.channels = await this.firestoreService.getChannels();
    } catch (error) {
      console.error('Error loading channels in component:', error);
    }
  }

  ngOnDestroy() {}

  setCurrentUser() {
    this.currentUser = this.userService.currentUser;
    this.currentUserId = this.userService.currentUser.uid;

    if (!this.currentUser) {
      console.error('currentUser ist nicht definiert!');
      return;
    }
  }

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

  sendChannelMessage() {
    this.firestoreService.sendMessage(this.currentChannelId, new Message(this.messageService.buildMessageObject(this.input)));
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

  async sendMessage() {
    if (this.message === '' || !this.currentRecieverId || !this.currentUserId) {
      return;
    } else if (this.whichMessage === 'user') {
      await this.sendDirectMessage();
      this.userService.setUrl('direct', this.currentUserId, this.currentRecieverId);
    } else if (this.whichMessage === 'channel') {
      this.sendChannelMessage();
      this.userService.setUrl('channel', this.currentChannelId);
    }
    this.currentReciever = null;
    this.currentChannel = null;
  }

  toggleList(event: Event) {
    this.isClicked = !this.isClicked;
    this.currentList = this.users;
    this.isChannel = false;
    event.stopPropagation();
  }

  hideList() {
    this.isClicked = false;
    this.isFound = false;
  }

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
