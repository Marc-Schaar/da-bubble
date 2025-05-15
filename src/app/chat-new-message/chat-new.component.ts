import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { UserService } from '../services/user/shared.service';
import { FireServiceService } from '../services/firebase/fire-service.service';
import { Firestore, arrayUnion, doc, updateDoc } from '@angular/fire/firestore';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { Message } from '../models/message/message';
import { DirectMessage } from '../models/direct-message/direct-message';
import { NavigationService } from '../services/navigation/navigation.service';
import { MessagesService } from '../services/messages/messages.service';
import { TextareaTemplateComponent } from '../shared/textarea/textarea-template.component';
import { MatIconModule } from '@angular/material/icon';
import { ChatHeaderComponent } from '../shared/chat-header/chat-header.component';
import { SearchService } from '../services/search/search.service';
@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-newmessage',
  imports: [CommonModule, FormsModule, TextareaTemplateComponent, MatIconModule, ChatHeaderComponent],
  templateUrl: './chat-new.component.html',
  styleUrl: './chat-new.component.scss',
})
export class NewmessageComponent {
  private userService = inject(UserService);
  private firestoreService = inject(FireServiceService);
  public navigationService: NavigationService = inject(NavigationService);
  private messageService: MessagesService = inject(MessagesService);
  public searchService: SearchService = inject(SearchService);
  private firestore = inject(Firestore);
  public channels: any[] = [];
  public users: any[] = [];
  public currentReciever: any = null;
  public currentUser: any = null;
  public currentChannel: any = null;

  message: string = '';
  input: string = '';
  userID: string = '';

  whichMessage: string = '';
  channelType: string = '';
  currentRecieverId: string = '';
  currentUserId: string = '';
  currentChannelId: string = '';
  currentMessages: any[] = [];

  isChannel: boolean = false;

  isFound: boolean = false;

  /**
   * ngOnInit lifecycle hook to load channels, users and set the current user.
   */
  async ngOnInit() {
    if (!this.navigationService.isInitialize) {
      this.navigationService.initialize();
    }

    this.setCurrentUser();
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
}
