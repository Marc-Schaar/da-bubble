import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { UserService } from '../shared.service';
import { FireServiceService } from '../fire-service.service';
import { Firestore, arrayUnion, doc, updateDoc, onSnapshot } from '@angular/fire/firestore';
import { Subscription } from 'rxjs';
import { DirectMessage } from '../directmessage.class';
import { FormsModule } from '@angular/forms';
@Injectable({
  providedIn: 'root',
})

@Component({
  selector: 'app-newmessage',
  imports: [CommonModule, FormsModule],
  templateUrl: './newmessage.component.html',
  styleUrl: './newmessage.component.scss'
})
export class NewmessageComponent {

  userService = inject(UserService);
  firestoreService = inject(FireServiceService);
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

  currenArray: any[] = []
  isClicked: boolean = false;
  listKey: string = '';
  isChannel: boolean = false;
  isProfileCard: boolean = false;
  whichMessage: string = '';
  channelType: string = '';
  docId: string = '';
  currentRecieverId: string = '';
  currentUserId: string = '';

  private subscription?: Subscription;
  constructor() {
    this.startChat();
  }

  async ngOnInit() {
    this.subscription = this.userService.startLoadingChat$.subscribe(() => {
      this.startChat();
    });
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

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  async startChat() {
    if (this.userService.user != null && this.userService.reciepentId != null) {

    } else {

      console.log('Chat muss per click initialisiert werden');
    }
  }
  setCurrentUser() {
    this.currentUser = this.userService.user;
    this.currentUserId = this.userService.user.uid
    console.log(this.currentUserId);

    if (!this.currentUser) {
      console.error('currentUser ist nicht definiert!');
      return;
    }
  }


  async sendDirectMessage() {
    if (this.message === '' || !this.currentRecieverId || !this.currentUserId) {
      return;
    }
    const message = new DirectMessage(this.userService.user?.displayName || '', this.userService.user?.photoURL || '', this.message, this.currentUserId, this.currentRecieverId);
    const messageData = this.createMessageData(message);
    const currentUserRef = doc(this.firestore, `users/${this.currentUserId}`);
    const currentReceiverRef = doc(this.firestore, `users/${this.currentRecieverId}`);
    if (this.currentRecieverId !== this.currentUserId) {
      await updateDoc(currentReceiverRef, { messages: arrayUnion(messageData) });
    }
    await updateDoc(currentUserRef, { messages: arrayUnion(messageData) });
    this.message = '';
    this.input = '';
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

  getCurrentChat() {

    if (this.input.includes('#')) {
      this.currenArray = this.channels;

      this.searchForReciever('channel')

    } else if (this.input.includes('@')) {
      this.currenArray = this.users;

      this.searchForReciever('user')
    }
  }

  searchForReciever(chat: string) {
    if (this.input.length > 3) {
      const INPUT = this.input.slice(1).trim().toLocaleLowerCase();
      console.log(INPUT);
      console.log(chat);
      this.whichMessage = chat;
      console.log(this.whichMessage);
      this.currenArray.forEach(object => {
        if (chat === 'user' && object.fullname.toLowerCase().includes(INPUT)) {
          console.log(object);
          this.input = '@' + object.fullname
          this.currentReciever = object;
          this.currentRecieverId = object.id
       

          console.log(this.currentRecieverId);

        }
        if (chat === 'channel' && object.name.toLowerCase().includes(INPUT)) {
          console.log(object);
          this.input = '#' + object.name
          this.currentChannel = object;
          console.log(this.currentChannel);

          //hier müssen evtl noch variable gesetzt werden um dann eine nachricht in den channel zu senden. 
        }
   

      });
    }
  }

  sendMessage() {
    if (this.whichMessage === 'user') {
      this.sendDirectMessage();
    }
    if (this.whichMessage === 'channel') {
      //hier muss die sendeMessageFunktion für den Channel gesetzt werden!
    }
  }

  toggleList(event: Event) {
    this.isClicked = !this.isClicked;
    this.currentList = this.users;
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
    if (
      this.message === '' ||
      (!this.message.includes('#') && !this.message.includes('@'))
    ) {
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



