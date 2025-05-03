import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { FireServiceService } from '../../../fire-service.service';
import { Message } from '../../../models/message/message';
import { MessagesService } from '../../../service/messages/messages.service';
import { UserService } from '../../../shared.service';
import { Navigation } from '@angular/router';
import { NavigationService } from '../../../service/navigation/navigation.service';

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
  @Input() currentChannelId: string = '';
  @Input() messages: any[] = [];

  /**
   * Sends a new message to the current channel.
   */
  newMessage(): void {
    if (this.input.trim() !== '') {
      this.fireService.sendMessage(
        this.currentChannelId,
        new Message(this.messagesService.buildChannelMessageObject(this.input, this.messages, this.reactions))
      );
      this.input = '';
    }
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
      this.userService.setUrl('direct', key, this.userService.userId);
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
    let newReaction = { emoji: emoji, from: this.userService.userId || 'n/a' };
    this.reactions.push(newReaction);
    console.log(this.reactions);
  }
}
