import { CommonModule } from '@angular/common';
import { Component, inject, Input } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import emojiData from 'unicode-emoji-json';
import { SearchResultComponent } from '../../../../shared/components/search-result/search-result.component';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import { ChannelMessage } from '../../models/channel-message/channel-message';
import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { MessagesService } from '../../services/messages/messages.service';

@Component({
  selector: 'app-textarea-template',
  imports: [CommonModule, FormsModule, MatIcon, SearchResultComponent],
  templateUrl: './textarea-template.component.html',
  styleUrl: './textarea-template.component.scss',
})
export class TextareaTemplateComponent {
  private messagesService = inject(MessagesService);
  public searchService: SearchService = inject(SearchService);
  private authService = inject(AuthService);
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
    this.input += ` ${tagName} `;
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
      const re = new RegExp(`${name}(?!//)`);
      result = result.replace(re, `${name}//`);
    }
    return result;
  }

  /**
   * Sends a new message in the current thread.
   */
  sendThreadMessage(messageToSend: string) {
    this.messagesService.sendThreadMessage(messageToSend, this.reciverId, this.threadId);
  }

  /**
   * Sends a new direct Message.
   */
  sendDirectMessage(messageToSend: string): void {
    this.messagesService.sendDirectMessage(messageToSend, this.reciverId);
  }

  /**
   * Sends a new message in the current Channel.
   */
  sendChannelMessage(messageToSend: string): void {
    this.messagesService.sendChannelMessage(messageToSend, this.reciverId);
  }

  /**
   * Adds an emoji to the Message - Input.
   * @param emoji - The emoji to add
   */
  public addEmoji(emoji: string) {
    this.input += emoji;
  }
}
