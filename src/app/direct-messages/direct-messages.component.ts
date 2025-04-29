import { Component, inject, Injectable, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { UserService } from '../shared.service';
import {
  Firestore,
  updateDoc,
  doc,
  arrayUnion,
  getDoc,
  onSnapshot,
  collection,
  addDoc,
  query,
  orderBy,
  DocumentData,
  CollectionReference,
} from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FireServiceService } from '../fire-service.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { NavigationService } from '../service/navigation/navigation.service';
import { MessagesService } from '../service/messages/messages.service';
import { DividerTemplateComponent } from '../shared/divider/divider-template.component';
import { DirectMessage } from '../models/direct-message/direct-message';
import { Subscription } from 'rxjs';

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
  channels: any[] = [];
  users: any[] = [];
  currentReciever: any = null;
  currentUser: any = null;
  currentList: any[] = [];
  currentMessages: any[] = [];
  isClicked: boolean = false;
  listKey: string = '';
  isChannel: boolean = false;
  isProfileCard: boolean = false;

  //Cleancode Update

  public userService = inject(UserService);
  public navigationService = inject(NavigationService);
  private firestore = inject(Firestore);
  private firestoreService = inject(FireServiceService);
  private route: ActivatedRoute = inject(ActivatedRoute);
  private messagesService = inject(MessagesService);

  private subscriptions = new Subscription();
  private unsubMessages!: () => void;

  public input: string = '';
  private currentRecieverId: string = '';
  private currentUserId: string = '';

  constructor() {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      this.currentRecieverId = params.get('id') || '';
      this.currentUserId = params.get('reciepentId') || '';

      this.currentUser = this.userService.currentUser;
      this.getRecieverFromUrl();
      this.loadMessages();
      this.loadUsers();
      this.loadChannels();
    });
  }

  async getRecieverFromUrl() {
    if (this.currentRecieverId) {
      const docRef = this.firestoreService.getDocRef('users', this.currentRecieverId);
      if (docRef) {
        const docSnap = await getDoc(docRef);
        docSnap.exists() ? (this.currentReciever = docSnap.data()) : null;
      }
    }
  }

  private loadMessages() {
    this.unsubMessages = this.messagesService.getConversationMessages(this.currentUserId, this.currentRecieverId, (messages) => {
      this.currentMessages = messages;
      this.isMessagesEmpty();
    });
  }

  private async loadUsers() {
    try {
      this.users = await this.firestoreService.getUsers();
    } catch (error) {
      console.error('Error loading users in component:', error);
    }
  }

  private async loadChannels() {
    try {
      this.channels = await this.firestoreService.getChannels();
    } catch (error) {
      console.error('Error loading channels in component:', error);
    }
  }

  public sendMessage() {
    if (!this.input.trim()) return;

    const messageData = this.messagesService.buildDirectMessageObject(
      this.input,
      this.currentMessages,
      this.currentUserId,
      this.currentRecieverId
    );

    const [uid1, uid2] = [this.currentUserId, this.currentRecieverId].sort();
    const conversationId = `${uid1}_${uid2}`;
    const senderConversationRef = collection(this.firestore, `users/${this.currentUserId}/conversations/${conversationId}/messages`);
    const receiverConversationRef = collection(this.firestore, `users/${this.currentRecieverId}/conversations/${conversationId}/messages`);
    this.postData(senderConversationRef, receiverConversationRef, messageData);
    this.input = '';
  }

  private async postData(
    senderConversationRef: CollectionReference<any, DocumentData>,
    receiverConversationRef: CollectionReference<any, DocumentData>,
    messageData: any
  ) {
    await Promise.all([
      addDoc(senderConversationRef, messageData),
      this.currentUserId !== this.currentRecieverId ? addDoc(receiverConversationRef, messageData) : Promise.resolve(),
    ]);
  }

  public getList() {
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

  public openReciver(i: number, key: string): void {
    this.isChannel ? this.userService.setUrl('channel', key) : this.userService.setUrl('direct', this.currentUserId, key);
  }

  public hideList() {
    this.isClicked = false;
  }

  public isMessagesEmpty(): boolean {
    return this.currentMessages.length === 0;
  }

  public isUser(message: any): boolean {
    return message.from === this.currentUserId;
  }

  public isYou(): boolean {
    return this.currentRecieverId === this.currentUserId;
  }

  public ngOnDestroy() {
    if (this.unsubMessages) this.unsubMessages();
    this.subscriptions.unsubscribe();
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

  toggleList(event: Event) {
    this.isClicked = !this.isClicked;
    this.currentList = this.users;
    this.isChannel = false;
    event.stopPropagation();
  }
}
