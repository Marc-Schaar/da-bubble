import { inject, Injectable } from '@angular/core';
import { NavigationService } from '../navigation/navigation.service';
import { UserStore } from '../user/user-store';
import { ChannelService } from '../../../features/channel/services/channel/channel.service';
import { Channel } from '../../../features/channel/models/channel/channel';
import { User } from '../../../features/auth/models/user/user';
import { isChannel } from '../../utils/receiver.util';

/**
 * Handles clicks on @user and #channel mentions rendered inside
 * messages (shared by channel messages and thread replies).
 */
@Injectable({
  providedIn: 'root',
})
export class MentionService {
  private readonly userStore = inject(UserStore);
  private readonly channelService = inject(ChannelService);
  private readonly navigationService = inject(NavigationService);

  /**
   * Inspects a click inside a rendered message and, if a mention chip
   * (.tag-btn) was hit, navigates to the mentioned user or channel.
   */
  public handleMentionClick(event: MouseEvent | TouchEvent): void {
    const btn = (event.target as HTMLElement).closest('.tag-btn');
    if (!btn) return;

    const fullTag = btn.textContent?.trim();
    if (!fullTag) return;

    const symbol = fullTag.charAt(0);
    const name = fullTag.slice(1).trim();
    this.navigateToMention(symbol, name);
  }

  /**
   * Navigates to a mentioned user ('@') or channel ('#') by name.
   */
  public async navigateToMention(symbol: string, name: string): Promise<void> {
    switch (symbol) {
      case '@': {
        const user = await this.userStore.findUserByDisplayName(name);
        if (user) this.navigationService.selectDirectMessageRecipient(user.id);
        break;
      }
      case '#': {
        const channel = await this.channelService.findChannelByName(name);
        if (channel?.id) this.navigationService.selectChannel(channel.id);
        break;
      }
    }
  }

  /**
   * Resolves the display name to insert for a suggestion list entry
   * (channel name or user display name). Shared by the mouse-click and the
   * keyboard-select (Enter) path so both stay in sync.
   */
  public resolveTagName(element: Channel | User): string {
    return isChannel(element) ? element.name : element.displayName;
  }

  /**
   * Splices a chosen tag into the compose input, replacing exactly the
   * in-progress `@`/`#` token between `tokenStart` and `tokenEnd` — never
   * the rest of the message. Returns the new text plus the caret position
   * right after the inserted tag, so the caller can refocus the input there.
   */
  public insertTag(
    currentInput: string,
    tagName: string,
    symbol: '@' | '#',
    tokenStart: number,
    tokenEnd: number,
  ): { text: string; caret: number } {
    const fullTag = `${symbol}${tagName}`;
    const text = currentInput.slice(0, tokenStart) + fullTag + ' ' + currentInput.slice(tokenEnd);
    return { text, caret: tokenStart + fullTag.length + 1 };
  }

  /**
   * Appends "//" to each mention in `taggedNames` (already including their
   * `@`/`#` symbol) found in `text`, but only for the first occurrence (if it
   * doesn't already end with "//"), marking it as a resolved mention before
   * the message is persisted.
   */
  public formatMentionMarkers(text: string, taggedNames: string[]): string {
    let result = text;
    for (const name of taggedNames) {
      const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = new RegExp(`${escaped}(?!//)`);
      result = result.replace(re, `${name}//`);
    }
    return result;
  }
}
