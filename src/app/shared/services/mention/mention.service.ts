import { inject, Injectable } from '@angular/core';
import { NavigationService } from '../navigation/navigation.service';
import { UserStore } from '../user/user-store';
import { ChannelService } from '../../../features/app_channel/services/channel/channel.service';

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
}
