
import { Component, inject, Injectable, OnInit, ElementRef, ViewChild, OnDestroy } from '@angular/core';
import { UserService } from '../shared.service';
import { Firestore, updateDoc, doc, query, arrayUnion } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FireServiceService } from '../fire-service.service';
import { Subscription } from 'rxjs';
import { DirectMessage } from '../directmessage.class';
import { collection, onSnapshot, orderBy } from 'firebase/firestore';

@Injectable({
  providedIn: 'root'
})

@Component({
  selector: 'app-direct-messages',
  imports: [FormsModule, CommonModule],
  templateUrl: './direct-messages.component.html',
  styleUrl: './direct-messages.component.scss',
})
export class DirectmessagesComponent implements OnInit, OnDestroy {
  @ViewChild('chat') chatContentRef!: ElementRef;
  userService = inject(UserService);
  fireService = inject(FireServiceService);
  index: number = -1;
  public users: any[] = [];
  public currentReciever: any = null;
  public currentUser: any = null;
  message: string = '';
  input: string = '';
  userID: string = '';
  currentMessages: any[] = [];
  firestore = inject(Firestore);
  isEmpty: boolean = false;
  isYou: boolean = false;
  isChat: boolean = false;
  private subscription?: Subscription;
  constructor() {
    this.startChat()
  }

  ngOnInit() {
    //this.startChat();
    this.subscription = this.userService.startLoadingChat$.subscribe(() => {
      this.startChat();
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  startChat() {
    console.log('start');
    if (this.userService.user != null && this.userService.currentReciever != null) {
      this.setCurrentReciever();
      this.loadMessages();
      this.checkReciever();
      this.isChat = true;
    } else {
      this.isChat === false
      console.log('Chat muss per click initialisiert werden');
    }


  }


  setCurrentReciever() {
    this.currentReciever = this.userService.currentReciever;
    this.currentUser = this.userService.currentUser;
    if (!this.currentReciever || !this.currentUser) {
      console.error('currentReciever oder currentUser sind nicht definiert!');
      return;
    }

  }


  async sendMessage() {
    if (this.message === '' || !this.currentReciever || !this.currentUser) { return };
    const message = new DirectMessage(this.currentUser.fullname, this.currentUser.profilephoto, this.message, this.currentUser.id, this.currentReciever.id);

    const messageData = this.createMessageData(message);
    const currentUserRef = doc(this.firestore, `users/${this.currentUser.id}`);
    const currentReceiverRef = doc(this.firestore, `users/${this.currentReciever.id}`);
    if (this.currentReciever.id !== this.currentUser.id) {
      await updateDoc(currentReceiverRef, {
        messages: arrayUnion(messageData)
    });
    }
    await updateDoc(currentUserRef, {
      messages: arrayUnion(messageData) 
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
      to: message.to
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
    const messagesRef = doc(this.firestore, `users/${this.currentUser.id}`);
    onSnapshot(messagesRef, (docSnapshot) => {
        if (docSnapshot.exists()) {
            const messageData = docSnapshot.data(); 
            const messages = messageData['messages'] || []; 
            this.currentMessages = []; 
            messages.forEach((message:any) => {
                if (this.currentUser.id === this.currentReciever.id) {
                    if (message['to'] === this.currentReciever.id && message['from'] === this.currentReciever.id) {
                        this.currentMessages.push(message);
                    }
                } else {
                    if (message['to'] === this.currentReciever.id || message['from'] === this.currentReciever.id) {
                        this.currentMessages.push(message);
                    }
                }
            });

            this.sortMessages();
            this.checkMessages();
        } else {
            console.log("Benutzerdokument existiert nicht.");
        }
    }); 
}


     /*
          this.currentUser.messages.forEach((message: any) => {
            if (this.currentUser.id === this.currentReciever.id) {
              if (message.to === this.currentReciever.id && message.from === this.currentReciever.id) {
                this.currentMessages.push(message);
              }
            } else {
              if (message.to === this.currentReciever.id || message.from === this.currentReciever.id) {
                this.currentMessages.push(message);
              }
            }
        */

  sortMessages() {
    this.currentMessages.sort((a: any, b: any) => {
      const timeA = new Date(a.time);
      const timeB = new Date(b.time);
      return timeA.getTime() - timeB.getTime();
    });

  }


  isNewDay(currentMessage: any, previousMessage: any) {
    if (!previousMessage) { return true };
    const currentDate = new Date(currentMessage.time).toDateString();
    const previousDate = new Date(previousMessage.time).toDateString();
    const today = new Date().toDateString();


    return currentDate !== previousDate;

  }

  isUser(message: any) {
    return message.from === this.currentUser.id

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
    if (this.currentReciever.id === this.currentUser.id) {
      this.isYou = true;
    } else {
      this.isYou = false;
    }
  }


  getCurrentChat() {
    console.log(this.input);
    if (this.input.includes('#')) {
      console.log('Channel laden');

    } else if (this.input.includes('@')) {
      console.log('Chat laden');

    }

  }
}

