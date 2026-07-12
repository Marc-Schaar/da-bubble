import { CommonModule } from '@angular/common';
import { Component, computed, inject, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChannelMessage } from '../../../models/channel-message/channel-message';
import { ReactionsService, ReactionContext } from '../../../services/reactions/reactions.service';
import { NavigationService } from '../../../../../shared/services/navigation/navigation.service';
import { PRESELECTED_EMOJIS } from '../../../../../shared/constants';

/**
 * Renders the emoji reactions of a message (footer) including the
 * hover tooltip with reacting users and the quick reaction menu.
 */
@Component({
  selector: 'app-message-reactions',
  imports: [CommonModule, MatIconModule],
  templateUrl: './message-reactions.component.html',
  styleUrl: './message-reactions.component.scss',
})
export class MessageReactionsComponent {
  public readonly reactionsService = inject(ReactionsService);
  public readonly navigationService = inject(NavigationService);

  public message = input.required<ChannelMessage>();
  public currentChannelId = input<string>('');
  public parentMessageId = input<string>('');
  public isThread = input<boolean>(false);

  public showAllReactions = false;
  public reactionMenuOpen = false;
  public readonly preSelectedEmojiList = Object.values(PRESELECTED_EMOJIS);

  public reactions = computed(() => this.message().reaction ?? []);

  /** How many reaction chips are shown before collapsing behind 'weitere'. */
  public visibleLimit = computed(() => (this.navigationService.isMobile() ? 2 : 20));

  public visibleReactions = computed(() => {
    const unique = this.reactionsService.uniqueEmojis(this.reactions());
    return this.showAllReactions ? unique : unique.slice(0, this.visibleLimit());
  });

  public hiddenCount = computed(() => this.reactionsService.countUniqueEmojis(this.reactions()) - this.visibleLimit());

  private context(): ReactionContext {
    return {
      channelId: this.currentChannelId(),
      parentMessageId: this.parentMessageId(),
      isThread: this.isThread(),
    };
  }

  public toggle(emoji: string): void {
    this.reactionsService.toggleReaction(this.message(), emoji, this.context());
    this.reactionMenuOpen = false;
  }
}
