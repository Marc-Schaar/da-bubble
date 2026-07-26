import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { FormsModule } from '@angular/forms';

import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

import { LinkifyPipe } from '../../../../shared/pipes/linkify.pipe';

import { ChannelMessage } from '../../models/channel-message/channel-message';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { DirectMessage } from '../../models/direct-message/direct-message';
import { User } from '../../../auth/models/user/user';
import { UserStore } from '../../../../shared/services/user/user-store';
import { MentionService } from '../../../../shared/services/mention/mention.service';
import { ReactionContext, ReactionsService } from '../../services/reactions/reactions.service';
import { MessagesService } from '../../services/messages/messages.service';
import { ProfileDialogService } from '../../../../shared/services/profile-dialog/profile-dialog.service';
import { MessageReactionsComponent } from './message-reactions/message-reactions.component';
import { EmojiQuickPickerComponent } from './emoji-quick-picker/emoji-quick-picker.component';
import { PRESELECTED_EMOJIS } from '../../../../shared/constants';
import { ButtonDirective } from '../../../../shared/components/button/button.directive';

@Component({
  selector: 'app-message-template',
  imports: [CommonModule, MatIconModule, FormsModule, LinkifyPipe, MessageReactionsComponent, EmojiQuickPickerComponent, ButtonDirective],
  templateUrl: './message-template.component.html',
  styleUrl: './message-template.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageTemplateComponent {
  public authService = inject(AuthService);
  public navigationService: NavigationService = inject(NavigationService);
  private readonly messagesService = inject(MessagesService);
  private readonly profileDialogService = inject(ProfileDialogService);
  private userStore: UserStore = inject(UserStore);
  private mentionService: MentionService = inject(MentionService);
  public reactionsService: ReactionsService = inject(ReactionsService);
  private elementRef: ElementRef<HTMLElement> = inject(ElementRef);

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

  /** Bound reference for EmojiQuickPickerComponent's isSelected input. */
  public readonly isReactionSelected = (emoji: string): boolean => this.hasReacted(emoji);

  /**
   * Enables editing mode for a specific message.
   * @param message - The message to edit
   */
  public editMessage(message: ChannelMessage | DirectMessage) {
    this.menuOpen = false;
    this.isEditing = true;
    this.inputEdit = message.message;
  }

  /**
   * Saves the edited message text via MessagesService, which resolves
   * whether this is a channel message or a thread reply.
   * @param message - The message to update.
   */
  public updateMessage(message: ChannelMessage | DirectMessage) {
    this.messagesService.updateMessageText(message.id, this.inputEdit, this.reactionContext());
    this.isEditing = false;
    this.inputEdit = '';
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
    const receiverData = await this._getReceiverByName();
    this.profileDialogService.open(receiverData);
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

  /**
   * Closes the actions/reaction menu on any click outside this message —
   * `mouseleave` alone missed touch input and clicks that pass over the
   * absolutely positioned menu on the way out.
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.menuOpen && !this.reactionMenuOpen) return;
    if (!this.elementRef.nativeElement.contains(event.target as Node)) {
      this.menuOpen = false;
      this.reactionMenuOpen = false;
    }
  }
}
