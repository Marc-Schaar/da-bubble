import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { FireServiceService } from '../../fire-service.service';
import { Message } from '../../models/message/message';
import { MessagesService } from '../../service/messages/messages.service';
import { UserService } from '../../shared.service';
import { NavigationService } from '../../service/navigation/navigation.service';
import { CollectionReference, Firestore } from '@angular/fire/firestore';
import { addDoc, collection, DocumentData } from '@firebase/firestore';

@Component({
  selector: 'app-textarea-template',
  imports: [CommonModule, FormsModule, MatIcon],
  templateUrl: './textarea-template.component.html',
  styleUrl: './textarea-template.component.scss',
})
export class TextareaTemplateComponent {
  fireService: FireServiceService = inject(FireServiceService);
  messagesService: MessagesService = inject(MessagesService);
  userService: UserService = inject(UserService);
  navigationService: NavigationService = inject(NavigationService);
  firestore: Firestore = inject(Firestore);

  listOpen: boolean = false;
  reactionMenuOpenInTextarea: boolean = false;
  isChannel: boolean = false;

  input: string = '';

  currentChannel: any;

  reactions: any[] = [];
  currentList: any[] = [];
  emojis: string[] = [
    'emoji _nerd face_',
    'emoji _person raising both hands in celebration_',
    'emoji _rocket_',
    'emoji _white heavy check mark_',
  ];

  @Input() currentUserId: string = '';
  @Input() reciverId: string = '';
  @Input() reciverName: string = '';
  @Input() messages: any[] = [];
  @Input() isChannelComponent: boolean = false;
  @Input() placeholderText: string = 'Starte eine neue Nachricht';
  @Input() reciverCompontent: 'channel' | 'direct' | 'thread' | 'default' = 'default';
  @Input() threadId: string = '';

  constructor() {}

  /**
   * Sends a new message to the current channel.
   */
  newMessage(): void {
    switch (this.reciverCompontent) {
      case 'direct':
        this.sendDirectMessage();
        break;

      case 'channel':
        this.sendChannelMessage();
        break;

      case 'thread':
        this.sendThreadMessage();
        break;

      default:
        break;
    }
  }

  /**
   * Sends a new message in the current thread.
   */
  sendThreadMessage() {
    if (this.input.trim() !== '') {
      this.fireService.sendThreadMessage(
        this.reciverId,
        new Message(this.messagesService.buildChannelMessageObject(this.input, this.messages, this.reactions)),
        this.threadId
      );
      this.input = '';
    }
  }

  sendDirectMessage(): void {
    if (!this.input.trim()) return;
    const messageData = this.messagesService.buildDirectMessageObject(this.input, this.messages, this.currentUserId, this.reciverId);
    const [uid1, uid2] = [this.currentUserId, this.reciverId].sort();
    const conversationId = `${uid1}_${uid2}`;
    const senderConversationRef = collection(this.firestore, `users/${this.currentUserId}/conversations/${conversationId}/messages`);
    const receiverConversationRef = collection(this.firestore, `users/${this.reciverId}/conversations/${conversationId}/messages`);
    this.postData(senderConversationRef, receiverConversationRef, messageData);
    this.input = '';
  }

  sendChannelMessage(): void {
    if (this.input.trim() !== '') {
      this.fireService.sendMessage(
        this.reciverId,
        new Message(this.messagesService.buildChannelMessageObject(this.input, this.messages, this.reactions))
      );
      this.input = '';
    }
  }

  /**
   * Posts the message data to both sender and receiver conversation collections in Firestore.
   */
  private async postData(
    senderConversationRef: CollectionReference<any, DocumentData>,
    receiverConversationRef: CollectionReference<any, DocumentData>,
    messageData: any
  ) {
    await Promise.all([
      addDoc(senderConversationRef, messageData),
      this.currentUserId !== this.reciverId ? addDoc(receiverConversationRef, messageData) : Promise.resolve(),
    ]);
  }

  /**
   * Handles autocomplete logic for mentions and channels in the input.
   * @param type - Optional preset string to insert
   */
  getList(type?: string): void {
    if (type) this.input = type;
    if (this.input.includes('#') || this.input.includes('@')) {
      if (this.input.includes('#')) {
        this.currentList = this.userService.channels;
        this.isChannel = true;
        this.listOpen = true;
      }

      if (this.input.includes('@')) {
        this.currentList = this.userService.users;
        this.isChannel = false;
        this.listOpen = true;
      }
    } else if (this.input === '') {
      this.currentList = [];
      this.listOpen = false;
    }
    this.reactionMenuOpenInTextarea = false;
  }

  /**
   * Opens a receiver (either a channel or a direct message) based on the input conditions.
   * @param i - The index of the message or item to open
   * @param key - The key identifier for the receiver (channel or direct message)
   */
  public openReciver(key: string): void {
    if (this.isChannel) {
      this.userService.setUrl('channel', key);
      this.navigationService.showChannel();
    } else if (!this.isChannel) {
      this.userService.setUrl('direct', key, this.userService.currentUser.id);
      this.navigationService.showDirect();
    }
    this.resetList();
  }

  /**
   * Resets the list of items, clears the input, and closes the list.
   */
  resetList() {
    this.currentList = [];
    this.listOpen = false;
    this.input = '';
  }

  /**
   * Adds an emoji to the local reactions array.
   * @param emoji - The emoji to add
   */
  addEmoji(emoji: string) {
    this.reactions = [];
    let newReaction = { emoji: emoji, from: this.userService.currentUser.id || 'n/a' };
    this.reactions.push(newReaction);
    console.log(this.reactions);
  }
}
