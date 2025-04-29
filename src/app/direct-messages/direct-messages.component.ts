import { Component, inject, Injectable, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { UserService } from '../shared.service';
import { Firestore, updateDoc, doc, arrayUnion, getDoc, onSnapshot, collection, addDoc, query, orderBy } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FireServiceService } from '../fire-service.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../service/navigation/navigation.service';
import { MessagesService } from '../service/messages/messages.service';
import { DividerTemplateComponent } from '../shared/divider/divider-template.component';
import { DirectMessage } from '../models/direct-message/direct-message';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-direct-messages',
  imports: [FormsModule, CommonModule, RouterLink, MatIconModule, DividerTemplateComponent],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss',
})
export class DirectmessagesComponent implements OnInit, OnDestroy {
  @ViewChild('chat') chatContentRef!: ElementRef;
  userService = inject(UserService);
  firestoreService = inject(FireServiceService);
  public channels: any[] = [];
  public users: any[] = [];
  public currentReciever: any = null;
  public currentUser: any = null;
  currentList: any[] = [];
  currentMessages: any[] = [];
  firestore = inject(Firestore);
  isClicked: boolean = false;
  listKey: string = '';
  isChannel: boolean = false;
  isProfileCard: boolean = false;

  //Cleancode Update
  currentRecieverId: string = '';
  currentUserId: string = '';
  input: string = '';

  route: ActivatedRoute = inject(ActivatedRoute);
  navigationService = inject(NavigationService);
  messagesService = inject(MessagesService);
  constructor() {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      this.currentRecieverId = params.get('id') || '';
      this.currentUserId = params.get('reciepentId') || '';

      this.currentUser = this.userService.currentUser;
      this.getRecieverFromUrl();
      this.loadMessages();
      this.loadChannels();
      this.loadUsers();
    });
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

  async getRecieverFromUrl() {
    if (this.currentRecieverId) {
      const docRef = doc(this.firestore, 'users', this.currentRecieverId);
      const docSnap = await getDoc(docRef);
      docSnap.exists() ? (this.currentReciever = docSnap.data()) : null;
    }
  }

  async sendMessage() {
    if (!this.input.trim()) return;

    const messageData = this.messagesService.createMessageData(
      this.input,
      this.currentMessages,
      this.currentUserId,
      this.currentRecieverId
    );

    const [uid1, uid2] = [this.currentUserId, this.currentRecieverId].sort();
    const conversationId = `${uid1}_${uid2}`;

    const senderConversationRef = collection(this.firestore, `users/${this.currentUserId}/conversations/${conversationId}/messages`);
    const receiverConversationRef = collection(this.firestore, `users/${this.currentRecieverId}/conversations/${conversationId}/messages`);

    await Promise.all([
      addDoc(senderConversationRef, messageData),
      this.currentUserId !== this.currentRecieverId ? addDoc(receiverConversationRef, messageData) : Promise.resolve(),
    ]);

    this.input = '';
  }

  loadMessages() {
    this.messagesService.getConversationMessages(this.currentUserId, this.currentRecieverId, (messages) => {
      this.currentMessages = messages;
      this.isMessagesEmpty();
    });
  }

  isMessagesEmpty() {
    return this.currentMessages.length === 0;
  }

  isUser(message: any) {
    return message.from === this.currentUserId;
  }

  isYou() {
    return this.currentRecieverId === this.currentUserId;
  }

  getCurrentChat() {
    if (this.input.includes('#')) {
      console.log('Channel laden');
      // this.navigationService.loadComponent('channel');
    } else if (this.input.includes('@')) {
      console.log('Chat laden');
      // this.navigationService.loadComponent('direct');
    }
  }

  toggleList(event: Event) {
    this.isClicked = !this.isClicked;
    this.currentList = this.users;
    this.isChannel = false;
    event.stopPropagation();
  }

  hideList() {
    this.isClicked = false;
  }

  getList() {
    if (this.input.includes('#')) {
      this.currentList = this.channels;
      this.isClicked = true;
      this.isChannel = true;
    }
    if (this.input.includes('@')) {
      this.isClicked = true;
      this.currentList = this.users;
      this.isChannel = false;
    }
    if (this.input === '' || (!this.input.includes('#') && !this.input.includes('@'))) {
      this.isClicked = false;
    }
  }
  /*
    toggleProfile() {
      this.isProfileCard = !this.isProfileCard
    }
  
    closeProfile() {
      this.isProfileCard = false;
    }
  */
  showProfile() {
    this.userService.showRecieverProfile();
  }

  openReciver(i: number, key: string) {
    this.isChannel
      ? this.userService.setUrl('channel', key)
      : this.userService.setUrl('direct', this.userService.auth.currentUser?.uid, key);
  }
}
