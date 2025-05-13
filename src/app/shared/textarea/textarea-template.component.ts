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
  private searchService: SearchService = inject(SearchService);

  listOpen: boolean = false;
  reactionMenuOpenInTextarea: boolean = false;
  isChannel: boolean = false;

  currentChannel: any;

  currentList: any[] = [];

  public input: string = '';
  public emojis: any;
  private tagType: 'channel' | 'user' | null = null;

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
   * Handles autocomplete logic for mentions and channels in the input.
   * @param type - Optional preset string to insert
   */
  public getList(type?: string): void {
    if (type) this.input = type;
    if (this.input.includes('#') || this.input.includes('@')) {
      if (this.input.includes('#')) {
        this.currentList = this.userService.channels.filter((channel: { data?: { member?: any[] } }) =>
          channel.data?.member?.some((member: any) => member.id === this.currentUserId)
        );
        if (this.userService.currentUser.isAnonymous) {
          this.currentList = this.userService.channels.filter((channel: { key: string }) => channel.key === 'KqvcY68R1jP2UsQkv6Nz');
        }
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
   * Adds an emoji to the Message - Input.
   * @param emoji - The emoji to add
   */
  public addEmoji(emoji: string) {
    this.input += emoji;
  }

  public observeInput() {
    let searchInput: string = '';
    this.getTagType();
    this.listOpen = false;
    switch (this.tagType) {
      case 'channel':
        searchInput = this.input.split('#')[1];
        this.currentList = this.searchService.startSearch(searchInput, this.tagType);
        this.isChannel = true;
        this.listOpen = true;
        break;

      case 'user':
        searchInput = this.input.split('@')[1];
        this.currentList = this.searchService.startSearch(searchInput, this.tagType);
        this.isChannel = false;
        this.listOpen = true;
        break;

      default:
        this.currentList = [];
        this.isChannel = false;
        this.listOpen = false;

        break;
    }
  }

  private getTagType() {
    if (this.input.includes('@')) this.tagType = 'user';
    if (this.input.includes('#')) this.tagType = 'channel';
  }

  public tagReciver(receiverData: any, tagType: any) {
    let tagName = receiverData.fullname || receiverData.data.name;
    this.input = this.input.split(tagType)[0];
    this.input += tagType + tagName;
  }
}
