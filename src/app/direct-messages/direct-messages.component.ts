import { Component, inject, Injectable, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { UserService } from '../shared.service';
import { Firestore, updateDoc, doc, arrayUnion, getDoc, onSnapshot } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FireServiceService } from '../fire-service.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { DirectMessage } from '../models/direct-message';
import { NavigationService } from '../service/navigation/navigation.service';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-direct-messages',
  imports: [FormsModule, CommonModule, RouterLink, MatIconModule],
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
  message: string = '';
  input: string = '';
  userID: string = '';
  currentMessages: any[] = [];
  firestore = inject(Firestore);
  isEmpty: boolean = false;
  isYou: boolean = false;
  isChat: boolean = false;
  isClicked: boolean = false;
  listKey: string = '';
  isChannel: boolean = false;
  isProfileCard: boolean = false;

  //Cleancode Update
  currentRecieverId: string = '';
  currentUserId: string = '';

  route: ActivatedRoute = inject(ActivatedRoute);
  navigationService = inject(NavigationService);
  constructor() {}

  ngOnInit() {
    this.route.queryParamMap.subscribe((params) => {
      this.currentRecieverId = params.get('id') || '';
      this.currentUserId = params.get('reciepentId') || '';
      this.isChat = true;

      this.currentUser = this.userService.currentUser;
      console.log('DirectComponent initialized');
      console.log('id:', this.currentRecieverId);
      console.log('reciepentId:', this.currentUserId);
      console.log('currentUser:', this.currentUser);
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
    const message = new DirectMessage(
      this.userService.currentUser?.displayName || '',
      this.userService.currentUser?.photoURL || '',
      this.message,
      this.currentUserId,
      this.currentRecieverId
    );
    const messageData = this.createMessageData(message);
    const currentUserRef = doc(this.firestore, `users/${this.currentUserId}`);
    const currentReceiverRef = doc(this.firestore, `users/${this.currentRecieverId}`);
    if (this.currentRecieverId !== this.currentUserId) {
      await updateDoc(currentReceiverRef, {
        messages: arrayUnion(messageData),
      });
    }
    await updateDoc(currentUserRef, {
      messages: arrayUnion(messageData),
    });
    this.isEmpty = false;
    //await this.updateUsers();
    //this.loadMessages()
    this.message = '';
  }

  createMessageData(message: DirectMessage) {
    return {
      name: message.name,
      photo: message.photo,
      content: message.content,
      time: message.time.toISOString(),
      from: message.from,
      to: message.to,
    };
  }

  /*
  async updateUsers() {
    try {
      const receiverDocRef = doc(this.firestore, `users/${this.currentReciever.id}`);
      const senderDocRef = doc(this.firestore, `users/${this.currentUser.id}`);
      if (this.currentReciever.id !== this.currentUser.id) {
        await updateDoc(receiverDocRef, {
          messages: this.currentReciever.messages
        });
      }
      await updateDoc(senderDocRef, {
        messages: this.currentUser.messages
      });
     
    } catch (error) {
      console.error("Fehler beim Speichern der Nachricht: ", error);
    }
  }
*/

  loadMessages() {
    const messagesRef = doc(this.firestore, `users/${this.currentRecieverId}`);
    onSnapshot(messagesRef, (docSnapshot) => {
      if (docSnapshot.exists()) {
        const messageData = docSnapshot.data();
        const messages = messageData['messages'] || [];
        this.currentMessages = [];
        messages.forEach((message: any) => {
          if (this.currentUserId === this.currentRecieverId) {
            if (message['to'] === this.currentRecieverId && message['from'] === this.currentRecieverId) {
              this.currentMessages.push(message);
            }
          } else {
            if (message['to'] === this.currentRecieverId || message['from'] === this.currentRecieverId) {
              this.currentMessages.push(message);
            }
          }
        });

        this.sortMessages();
        this.checkMessages();
      } else {
        console.log('Benutzerdokument existiert nicht.');
      }
    });
  }

  sortMessages() {
    this.currentMessages.sort((a: any, b: any) => {
      const timeA = new Date(a.time);
      const timeB = new Date(b.time);
      return timeA.getTime() - timeB.getTime();
    });
  }

  isNewDay(currentMessage: any, previousMessage: any) {
    if (!previousMessage) {
      return true;
    }
    const currentDate = new Date(currentMessage.time).toDateString();
    const previousDate = new Date(previousMessage.time).toDateString();
    const today = new Date().toDateString();

    return currentDate !== previousDate;
  }

  isUser(message: any) {
    return message.from === this.currentUserId;
  }

  isToday(date: string) {
    const today = new Date().toDateString();
    const messageDate = new Date(date);
    return today === messageDate.toDateString();
  }

  checkMessages() {
    if (this.currentMessages.length === 0) {
      this.isEmpty = true;
    } else {
      this.isEmpty = false;
    }
  }

  checkReciever() {
    if (this.currentRecieverId === this.currentUserId) {
      this.isYou = true;
    } else {
      this.isYou = false;
    }
  }

  getCurrentChat() {
    console.log(this.input);
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
