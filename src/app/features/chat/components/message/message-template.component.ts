import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, ViewChild } from '@angular/core';
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
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-message-template',
  imports: [CommonModule, MatIconModule, FormsModule, LinkifyPipe, MessageReactionsComponent, EmojiQuickPickerComponent, ButtonComponent],
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

  @ViewChild('menuBtn', { read: ElementRef }) private menuBtn?: ElementRef<HTMLElement>;
  @ViewChild('menuPopup', { read: ElementRef }) private menuPopup?: ElementRef<HTMLElement>;
  @ViewChild('reactionBtn', { read: ElementRef }) private reactionBtn?: ElementRef<HTMLElement>;
  @ViewChild('reactionPopup', { read: ElementRef }) private reactionPopup?: ElementRef<HTMLElement>;

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
   * Toggles the own-message edit menu, closing the reaction quick-picker
   * so only one popup is ever open at a time.
   */
  public toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
    if (this.menuOpen) this.reactionMenuOpen = false;
  }

  /**
   * Toggles the reaction quick-picker, closing the edit menu so only one
   * popup is ever open at a time.
   */
  public toggleReactionMenu(): void {
    this.reactionMenuOpen = !this.reactionMenuOpen;
    if (this.reactionMenuOpen) this.menuOpen = false;
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
   * Closes each popup individually on any click outside its own toggle
   * button and popup content — clicking elsewhere in the same message row
   * (avatar, name, other action buttons) now closes an open popup instead
   * of being treated as "inside".
   */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    const target = event.target as Node;
    if (this.menuOpen && !this.menuBtn?.nativeElement.contains(target) && !this.menuPopup?.nativeElement.contains(target)) {
      this.menuOpen = false;
    }
    if (
      this.reactionMenuOpen &&
      !this.reactionBtn?.nativeElement.contains(target) &&
      !this.reactionPopup?.nativeElement.contains(target)
    ) {
      this.reactionMenuOpen = false;
    }
  }

  /**
   * Closes the actions/reaction menu on Escape, for keyboard users who
   * opened it without a mouse to click outside with.
   */
  @HostListener('document:keydown.escape')
  onEscape() {
    this.menuOpen = false;
    this.reactionMenuOpen = false;
  }
}
