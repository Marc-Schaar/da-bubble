import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { FireServiceService } from '../../services/firebase/fire-service.service';
import { Message } from '../../models/message/message';
import { MessagesService } from '../../services/messages/messages.service';
import { UserService } from '../../services/user/shared.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { CollectionReference, Firestore } from '@angular/fire/firestore';
import { addDoc, collection, DocumentData } from '@firebase/firestore';
import emojiData from 'unicode-emoji-json';
import { SearchService } from '../../services/search/search.service';
import { SearchResultComponent } from '../search-result/search-result.component';

@Component({
  selector: 'app-textarea-template',
  imports: [CommonModule, FormsModule, MatIcon, SearchResultComponent],
  templateUrl: './textarea-template.component.html',
  styleUrl: './textarea-template.component.scss',
})
export class TextareaTemplateComponent {
  fireService: FireServiceService = inject(FireServiceService);
  messagesService: MessagesService = inject(MessagesService);
  userService: UserService = inject(UserService);
  navigationService: NavigationService = inject(NavigationService);
  firestore: Firestore = inject(Firestore);
  public searchService: SearchService = inject(SearchService);

  reactionMenuOpenInTextarea: boolean = false;

  currentChannel: any;

  public input: string = '';
  public emojis: any;

  @Input() currentUserId: string = '';
  @Input() reciverId: string = '';
  @Input() reciverName: string = '';
  @Input() messages: any[] = [];
  @Input() isChannelComponent: boolean = false;
  @Input() placeholderText: string = 'Starte eine neue Nachricht';
  @Input() reciverCompontent: 'channel' | 'direct' | 'thread' | 'default' = 'default';
  @Input() threadId: string = '';

  constructor() {
    this.emojis = Object.keys(emojiData);
  }

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
        new Message(this.messagesService.buildChannelMessageObject(this.input, this.messages)),
        this.threadId
      );
      this.input = '';
    }
  }

  /**
   * Sends a new direct Message.
   */
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

  /**
   * Sends a new message in the current Channel.
   */
  sendChannelMessage(): void {
    if (this.input.trim() !== '') {
      this.fireService.sendMessage(this.reciverId, new Message(this.messagesService.buildChannelMessageObject(this.input, this.messages)));
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
   * Adds an emoji to the Message - Input.
   * @param emoji - The emoji to add
   */
  public addEmoji(emoji: string) {
    this.input += emoji;
  }
}
