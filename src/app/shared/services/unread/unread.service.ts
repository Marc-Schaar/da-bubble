import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { FireServiceService } from '../firebase/fire-service.service';
import { AuthService } from '../../../features/auth/services/auth/auth.service';
import { NavigationService } from '../navigation/navigation.service';
import { UnreadCounter } from '../../models/unread-counter/unread-counter';
import { getConversationId } from '../../utils/conversation-id.util';

/**
 * Tracks per-chat unread-message counts for the current user (channels and
 * DMs alike) and auto-marks the chat the user currently has open as read.
 * Started implicitly by the first component that injects it (e.g. the
 * contactbar), same lifecycle pattern as ChannelsApiService.subChannels().
 */
@Injectable({
  providedIn: 'root',
})
export class UnreadService {
  private readonly fireService = inject(FireServiceService);
  private readonly authService = inject(AuthService);
  private readonly navigationService = inject(NavigationService);

  private readonly _unreadCounters = signal<UnreadCounter[]>([]);
  private unsubUnreadCounters?: () => void;

  /** Map of chatId (channelId or DM conversationId) -> unread count. */
  public readonly unreadCounts = computed(() => {
    const map = new Map<string, number>();
    for (const counter of this._unreadCounters()) {
      if (counter.id) map.set(counter.id, counter.unreadCount ?? 0);
    }
    return map;
  });

  constructor() {
    effect(() => {
      const userId = this.authService.currentUser()?.id ?? null;
      untracked(() => this.subscribe(userId));
    });

    effect(() => {
      const activeChatId = this.navigationService.activeChatId();
      const activeChatType = this.navigationService.activeChatType();
      const counts = this.unreadCounts();
      untracked(() => {
        const chatId = this.resolveActiveChatId(activeChatId, activeChatType);
        if (chatId && (counts.get(chatId) ?? 0) > 0) {
          this.markAsRead(chatId);
        }
      });
    });
  }

  /** For DMs the route carries the *other* user's id — resolve it into the conversationId used as the unread-counter key. */
  private resolveActiveChatId(activeChatId: string | null, activeChatType: 'channel' | 'direct' | null): string | null {
    if (!activeChatId || !activeChatType) return null;
    if (activeChatType === 'channel') return activeChatId;

    const currentUserId = this.authService.currentUser()?.id;
    return currentUserId ? getConversationId(currentUserId, activeChatId) : null;
  }

  private subscribe(userId: string | null): void {
    this.unsubUnreadCounters?.();
    this.unsubUnreadCounters = undefined;
    if (!userId) {
      this._unreadCounters.set([]);
      return;
    }
    this.unsubUnreadCounters = this.fireService.subUnreadCounters(userId, (counters) => this._unreadCounters.set(counters));
  }

  public markAsRead(chatId: string | null): void {
    const userId = this.authService.currentUser()?.id;
    if (!userId || !chatId) return;
    this.fireService.resetUnread(userId, chatId);
  }
}
