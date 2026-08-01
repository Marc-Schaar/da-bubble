import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, ElementRef, HostListener, inject, input, signal, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ChannelMessage } from '../../../models/channel-message/channel-message';
import { ReactionsService, ReactionContext } from '../../../services/reactions/reactions.service';
import { NavigationService } from '../../../../../shared/services/navigation/navigation.service';
import { PRESELECTED_EMOJIS } from '../../../../../shared/constants';
import { EmojiQuickPickerComponent } from '../emoji-quick-picker/emoji-quick-picker.component';
import { ButtonComponent } from '../../../../../shared/components/button/button.component';
import { FocusTrapPanelDirective } from '../../../../../shared/directives/focus-trap-panel.directive';

/**
 * Renders the emoji reactions of a message (footer) including the
 * hover tooltip with reacting users and the quick reaction menu.
 */
@Component({
  selector: 'app-message-reactions',
  imports: [CommonModule, MatIconModule, EmojiQuickPickerComponent, ButtonComponent, FocusTrapPanelDirective],
  templateUrl: './message-reactions.component.html',
  styleUrl: './message-reactions.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MessageReactionsComponent {
  public readonly reactionsService = inject(ReactionsService);
  public readonly navigationService = inject(NavigationService);

  @ViewChild('reactionBtn', { read: ElementRef }) private reactionBtn?: ElementRef<HTMLElement>;
  @ViewChild('reactionPopup', { read: ElementRef }) private reactionPopup?: ElementRef<HTMLElement>;

  public message = input.required<ChannelMessage>();
  public currentChannelId = input<string>('');
  public parentMessageId = input<string>('');
  public isThread = input<boolean>(false);

  public showAllReactions = signal(false);
  public reactionMenuOpen = signal(false);
  public readonly preSelectedEmojiList = Object.values(PRESELECTED_EMOJIS);

  public reactions = computed(() => this.message().reaction ?? []);

  /** How many reaction chips are shown before collapsing behind 'weitere'. */
  public visibleLimit = computed(() => (this.navigationService.isMobile() ? 2 : 20));

  public visibleReactions = computed(() => {
    const unique = this.reactionsService.uniqueEmojis(this.reactions());
    return this.showAllReactions() ? unique : unique.slice(0, this.visibleLimit());
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
    this.reactionMenuOpen.set(false);
  }

  /** Bound reference for EmojiQuickPickerComponent's isSelected input. */
  public readonly isReactionSelected = (emoji: string): boolean => this.reactionsService.hasReacted(emoji, this.reactions());

  /** Closes the quick-reaction menu on any click outside its button/popup. */
  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.reactionMenuOpen()) return;
    const target = event.target as Node;
    if (!this.reactionBtn?.nativeElement.contains(target) && !this.reactionPopup?.nativeElement.contains(target)) {
      this.reactionMenuOpen.set(false);
    }
  }
}
