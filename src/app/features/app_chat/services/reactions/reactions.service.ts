import { inject, Injectable } from '@angular/core';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { UserStore } from '../../../../shared/services/user/user-store';
import { ChannelMessage, Reaction } from '../../models/channel-message/channel-message';

export interface ReactionContext {
  channelId: string;
  parentMessageId?: string;
  isThread?: boolean;
}

/**
 * Owns all emoji-reaction logic for channel and thread messages
 * (shared by the hover reaction bar and the message footer).
 */
@Injectable({
  providedIn: 'root',
})
export class ReactionsService {
  private readonly fireService = inject(FireServiceService);
  private readonly userStore = inject(UserStore);

  private currentUserId(): string {
    return this.userStore.currentUser()?.id || 'n/a';
  }

  private getMessageRef(messageId: string, context: ReactionContext) {
    return context.isThread && context.parentMessageId
      ? this.fireService.getMessageThreadRef(context.channelId, context.parentMessageId, messageId)
      : this.fireService.getMessageRef(context.channelId, messageId);
  }

  /**
   * Adds the emoji reaction, or removes it if the user already reacted with it.
   */
  public toggleReaction(message: ChannelMessage, emoji: string, context: ReactionContext): void {
    if (this.hasReacted(emoji, message.reaction)) {
      this.removeReaction(message, emoji, context);
      return;
    }

    message.reaction.push({ emoji: emoji, from: this.currentUserId() });
    const messageRef = this.getMessageRef(message.id, context);
    if (messageRef) this.fireService.updateReaction(messageRef, message.reaction);
  }

  /**
   * Removes the user's reaction with the given emoji from the message.
   */
  public removeReaction(message: ChannelMessage, emoji: string, context: ReactionContext): void {
    const reactionIndex = message.reaction.findIndex((r) => r.from === this.currentUserId() && r.emoji === emoji);
    if (reactionIndex < 0) return;

    message.reaction.splice(reactionIndex, 1);
    const messageRef = this.getMessageRef(message.id, context);
    if (messageRef) this.fireService.updateReaction(messageRef, message.reaction);
  }

  /**
   * Whether the current user already reacted with this emoji.
   */
  public hasReacted(emoji: string, reactions: Reaction[]): boolean {
    return reactions.some((reaction) => reaction.from === this.currentUserId() && reaction.emoji === emoji);
  }

  /**
   * Filters unique emojis from the reactions array.
   */
  public uniqueEmojis(reactions: Reaction[]): Reaction[] {
    return reactions.filter((reaction, index) => index === reactions.findIndex((r) => r.emoji === reaction.emoji));
  }

  /**
   * Counts how many times an emoji was used in a reaction list.
   */
  public countEmoji(emoji: string, reactions: Reaction[]): number {
    return reactions.filter((r) => r.emoji === emoji).length;
  }

  /**
   * Counts how many unique emojis exist in a list.
   */
  public countUniqueEmojis(reactions: Reaction[]): number {
    return new Set(reactions.map((r) => r.emoji)).size;
  }

  /**
   * Returns the display names of users who reacted with the emoji;
   * the current user is rendered as 'Du' / 'und du'.
   */
  public getReactionNamesForEmoji(targetEmoji: string, reactions: Reaction[]): string[] {
    const allUsers = this.fireService.allUsers();
    const userIds = reactions.filter((r) => r.emoji === targetEmoji).map((r) => r.from);
    const currentUserId = this.userStore.currentUser()?.id;
    const hasCurrentUserReacted = userIds.includes(currentUserId || '');

    const otherUsers = allUsers.filter((user) => userIds.includes(user.id) && user.id !== currentUserId).map((user) => user.displayName);

    if (hasCurrentUserReacted) {
      if (otherUsers.length === 0) return ['Du'];
      otherUsers.push('und du');
    }
    return otherUsers;
  }
}
