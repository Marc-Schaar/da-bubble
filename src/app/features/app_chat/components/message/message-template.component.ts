import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, input } from '@angular/core';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { MatIconModule } from '@angular/material/icon';

import { FormsModule } from '@angular/forms';

import { MatDialog } from '@angular/material/dialog';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

import { LinkifyPipe } from '../../../../shared/pipes/linkify.pipe';

import { DialogReciverComponent } from '../../../dialogs/dialog-reciver/dialog-reciver.component';
import { ChannelMessage } from '../../models/channel-message/channel-message';
import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { DirectMessage } from '../../models/direct-message/direct-message';
import { User } from '../../../app_auth/models/user/user';
import { UserStore } from '../../../../shared/services/user/user-store';
import { MentionService } from '../../../../shared/services/mention/mention.service';
import { ReactionContext, ReactionsService } from '../../services/reactions/reactions.service';
import { MessageReactionsComponent } from './message-reactions/message-reactions.component';
import { PRESELECTED_EMOJIS } from '../../../../shared/constants';

@Component({
  selector: 'app-message-template',
  imports: [CommonModule, MatIconModule, FormsModule, LinkifyPipe, MessageReactionsComponent],
  templateUrl: './message-template.component.html',
  styleUrl: './message-template.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageTemplateComponent {
  private fireService: FireServiceService = inject(FireServiceService);
  public authService = inject(AuthService);
  private dialog = inject(MatDialog);
  public navigationService: NavigationService = inject(NavigationService);
  private userStore: UserStore = inject(UserStore);
  private mentionService: MentionService = inject(MentionService);
  public reactionsService: ReactionsService = inject(ReactionsService);

  menuOpen: boolean = false;
  reactionMenuOpen: boolean = false;
  isEditing: boolean = false;
  inputEdit: string = '';
  public readonly preSelectedEmojis = PRESELECTED_EMOJIS;
  public readonly preSelectedEmojiList = Object.values(PRESELECTED_EMOJIS);

  message = input.required<ChannelMessage | DirectMessage>();
  currentChannelId = input<string>('');
  parentMessageId = input<string>('');
  isThread = input<boolean>(false);
  channelType = input<'direct' | 'channel' | 'thread' | null>(null);

  isChannelMessage = computed(() => this.message() instanceof ChannelMessage);

  isOwnMessage = computed(() => this.message().name === this.authService.currentUser()?.displayName);

  reactions = computed(() => {
    const msg = this.message();
    return msg instanceof ChannelMessage ? msg.reaction : [];
  });

  private reactionContext(): ReactionContext {
    return {
      channelId: this.currentChannelId(),
      parentMessageId: this.parentMessageId(),
      isThread: this.isThread(),
    };
  }

  /**
   * Toggles an emoji reaction on this message (hover reaction bar).
   */
  public toggleReaction(emoji: string) {
    const msg = this.message();
    if (msg instanceof ChannelMessage) {
      this.reactionsService.toggleReaction(msg, emoji, this.reactionContext());
      this.reactionMenuOpen = false;
    }
  }

  public hasReacted(emoji: string): boolean {
    return this.reactionsService.hasReacted(emoji, this.reactions());
  }

  /**
   * Enables editing mode for a specific message.
   * @param message - The message to edit
   */
  public editMessage(message: ChannelMessage | DirectMessage) {
    this.menuOpen = false;
    this.isEditing = true;
    this.inputEdit = message.message;
  }

  public async updateMessage(message: ChannelMessage | DirectMessage) {
    this.isThread() ? this.updateThreadMessage(message) : this.updateChannelMessage(message);
  }

  /**
   * Updates the message after editing.
   * @param message - The message to update.
   */
  private updateThreadMessage(message: ChannelMessage | DirectMessage) {
    let messageRef = this.fireService.getMessageThreadRef(this.currentChannelId(), this.parentMessageId(), message.id);
    if (messageRef) {
      this.isEditing = false;
      try {
        this.fireService.updateMessage(messageRef, this.inputEdit);
        this.inputEdit = '';
      } catch (error) {}
    }
  }

  /**
   * Updates the content of an edited message.
   * @param message - The message to update
   */
  private updateChannelMessage(message: ChannelMessage | DirectMessage) {
    let messageRef = this.fireService.getMessageRef(this.currentChannelId(), message.id);
    if (messageRef) {
      this.isEditing = false;
      this.fireService.updateMessage(messageRef, this.inputEdit);
      this.inputEdit = '';
    }
  }

  /**
   * Opens the thread view for a specific message.
   * @param messageId - ID of the message to open
   */
  public openThread(messageId: string) {
    this.navigationService.goToThread(messageId, this.currentChannelId());
  }

  /**
   * Cancels editing mode and resets input.
   */
  public cancel() {
    this.isEditing = false;
    this.menuOpen = false;
  }

  /**
   * Displays the receiver's profile.
   */
  public async showProfile() {
    const reciverData = await this._getReceiverByName();
    this.dialog.open(DialogReciverComponent, {
      data: reciverData,
      width: '400px',
      panelClass: ['center-dialog'],
    });
  }

  /**
   * Resolves the message author's user document by display name.
   */
  private async _getReceiverByName(): Promise<User | null> {
    const searchName = this.message().name;
    if (!searchName) return null;
    return this.userStore.findUserByDisplayName(searchName);
  }

  /**
   * Delegates clicks inside the rendered message to the MentionService.
   */
  onMentionClick(event: MouseEvent | TouchEvent) {
    this.mentionService.handleMentionClick(event);
  }
}
