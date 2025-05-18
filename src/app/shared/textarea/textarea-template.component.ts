import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { FireServiceService } from '../../services/firebase/fire-service.service';
import { Message } from '../../models/message/message';
import { MessagesService } from '../../services/messages/messages.service';
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
  private fireService: FireServiceService = inject(FireServiceService);
  private messagesService: MessagesService = inject(MessagesService);
  private firestore: Firestore = inject(Firestore);
  public searchService: SearchService = inject(SearchService);
  public reactionMenuOpenInTextarea: boolean = false;
  public input: string = '';
  private taggedNames: string[] = [];

  public emojis: any;
  @Input() currentUserId: string = '';
  @Input() reciverId: string = '';
  @Input() reciverName: string = '';
  @Input() messages: any[] = [];
  @Input() isChannelComponent: boolean = false;
  @Input() placeholderText: string = 'Starte eine neue Nachricht';
  @Input() reciverCompontent: 'channel' | 'direct' | 'thread' | 'default' = 'default';
  @Input() threadId: string = '';

  /**
   * Initializes the component by setting the emojis array
   * from the keys of the imported emojiData object.
   */
  constructor() {
    this.emojis = Object.keys(emojiData);
  }

  onTagInserted(tagName: string) {
    this.input += ` @${tagName} `;
    this.taggedNames.push(tagName);
  }

  /**
   * Sends a new message based on the current receiver component type.
   * Calls the appropriate send method for 'direct', 'channel', or 'thread'.
   */
  newMessage(): void {
    if (!this.input.trim()) return;
    const messageToSend = this.addMarkerSlashes(this.input);
    switch (this.reciverCompontent) {
      case 'direct':
        this.sendDirectMessage(messageToSend);
        break;

      case 'channel':
        this.sendChannelMessage(messageToSend);
        break;

      case 'thread':
        this.sendThreadMessage(messageToSend);
        break;

      default:
        break;
    }
    this.input = '';
    this.taggedNames = [];
  }

  /**
   * Appends "//" to each mention stored in `taggedNames`,
   * but only for the first occurrence (if it doesn’t already end with "//").
   */
  private addMarkerSlashes(text: string): string {
    let result = text;
    for (const name of this.taggedNames) {
      const re = new RegExp(`@${name}(?!//)`);
      result = result.replace(re, `@${name}//`);
    }
    return result;
  }

  /**
   * Sends a new message in the current thread.
   */
  sendThreadMessage(messageToSend: string) {
    this.fireService.sendThreadMessage(
      this.reciverId,
      new Message(this.messagesService.buildChannelMessageObject(messageToSend, this.messages)),
      this.threadId
    );
  }

  /**
   * Sends a new direct Message.
   */
  sendDirectMessage(messageToSend: string): void {
    const messageData = this.messagesService.buildDirectMessageObject(messageToSend, this.messages, this.currentUserId, this.reciverId);
    const [uid1, uid2] = [this.currentUserId, this.reciverId].sort();
    const conversationId = `${uid1}_${uid2}`;
    const senderConversationRef = collection(this.firestore, `users/${this.currentUserId}/conversations/${conversationId}/messages`);
    const receiverConversationRef = collection(this.firestore, `users/${this.reciverId}/conversations/${conversationId}/messages`);
    this.postData(senderConversationRef, receiverConversationRef, messageData);
  }

  /**
   * Sends a new message in the current Channel.
   */
  sendChannelMessage(messageToSend: string): void {
    this.fireService.sendMessage(this.reciverId, new Message(this.messagesService.buildChannelMessageObject(messageToSend, this.messages)));
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
