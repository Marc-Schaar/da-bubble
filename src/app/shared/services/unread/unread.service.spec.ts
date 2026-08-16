import { TestBed } from '@angular/core/testing';
import { UnreadService } from './unread.service';
import { FireServiceService } from '../firebase/fire-service.service';
import { AuthService } from '../../../features/auth/services/auth/auth.service';
import { NavigationService } from '../navigation/navigation.service';
import { mockSignal } from '../../../../testing/signal-service-mock.util';
import { makeUser } from '../../../../testing/user-fixtures';
import { User } from '../../../features/auth/models/user/user';
import { UnreadCounter } from '../../models/unread-counter/unread-counter';
import { getConversationId } from '../../utils/conversation-id.util';

describe('UnreadService', () => {
  let service: UnreadService;
  let fireServiceSpy: jasmine.SpyObj<FireServiceService>;
  let currentUserSignal: ReturnType<typeof mockSignal<User | null>>;
  let activeChatIdSignal: ReturnType<typeof mockSignal<string | null>>;
  let activeChatTypeSignal: ReturnType<typeof mockSignal<'channel' | 'direct' | null>>;

  function latestCountersCallback(): (counters: UnreadCounter[]) => void {
    return fireServiceSpy.subUnreadCounters.calls.mostRecent().args[1];
  }

  beforeEach(() => {
    fireServiceSpy = jasmine.createSpyObj<FireServiceService>('FireServiceService', ['subUnreadCounters', 'resetUnread']);
    fireServiceSpy.resetUnread.and.resolveTo();

    currentUserSignal = mockSignal<User | null>(null);
    activeChatIdSignal = mockSignal<string | null>(null);
    activeChatTypeSignal = mockSignal<'channel' | 'direct' | null>(null);

    const authServiceMock = { currentUser: currentUserSignal } as unknown as AuthService;
    const navigationServiceMock = {
      activeChatId: activeChatIdSignal,
      activeChatType: activeChatTypeSignal,
    } as unknown as NavigationService;

    TestBed.configureTestingModule({
      providers: [
        { provide: FireServiceService, useValue: fireServiceSpy },
        { provide: AuthService, useValue: authServiceMock },
        { provide: NavigationService, useValue: navigationServiceMock },
      ],
    });
    service = TestBed.inject(UnreadService);
    TestBed.flushEffects(); // run the initial effect pass (currentUser=null, activeChat=null)
  });

  describe('subscribe-on-user-change effect', () => {
    it('does not call fireService.subUnreadCounters while there is no current user', () => {
      expect(fireServiceSpy.subUnreadCounters).not.toHaveBeenCalled();
      expect(service.unreadCounts()).toEqual(new Map());
    });

    it('subscribes once a current user appears', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();

      expect(fireServiceSpy.subUnreadCounters).toHaveBeenCalledTimes(1);
      expect(fireServiceSpy.subUnreadCounters.calls.mostRecent().args[0]).toBe('me');
    });

    it('unsubscribes the previous listener and resubscribes when the user id changes', () => {
      const unsub1 = jasmine.createSpy('unsub1');
      const unsub2 = jasmine.createSpy('unsub2');
      fireServiceSpy.subUnreadCounters.and.returnValues(unsub1, unsub2);

      currentUserSignal.set(makeUser({ id: 'user-1' }));
      TestBed.flushEffects();
      expect(unsub1).not.toHaveBeenCalled();

      currentUserSignal.set(makeUser({ id: 'user-2' }));
      TestBed.flushEffects();

      expect(unsub1).toHaveBeenCalledTimes(1);
      expect(fireServiceSpy.subUnreadCounters).toHaveBeenCalledTimes(2);
      expect(fireServiceSpy.subUnreadCounters.calls.mostRecent().args[0]).toBe('user-2');
    });

    it('unsubscribes and clears unreadCounts when the user logs out', () => {
      const unsub = jasmine.createSpy('unsub');
      fireServiceSpy.subUnreadCounters.and.returnValue(unsub);

      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();
      latestCountersCallback()([{ id: 'chan-1', type: 'channel', unreadCount: 3 }]);

      currentUserSignal.set(null);
      TestBed.flushEffects();

      expect(unsub).toHaveBeenCalledTimes(1);
      expect(service.unreadCounts()).toEqual(new Map());
      expect(fireServiceSpy.subUnreadCounters).toHaveBeenCalledTimes(1); // not called again for null
    });
  });

  describe('unreadCounts computed', () => {
    it('builds a Map of chatId -> unreadCount from the streamed counters', () => {
      fireServiceSpy.subUnreadCounters.and.returnValue(jasmine.createSpy('unsub'));
      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();

      latestCountersCallback()([
        { id: 'chan-1', type: 'channel', unreadCount: 3 },
        { id: 'conv-1', type: 'direct', unreadCount: 0 },
      ]);

      const map = service.unreadCounts();
      expect(map.get('chan-1')).toBe(3);
      expect(map.get('conv-1')).toBe(0);
      expect(map.size).toBe(2);
    });

    it('skips counters with a falsy id', () => {
      fireServiceSpy.subUnreadCounters.and.returnValue(jasmine.createSpy('unsub'));
      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();

      latestCountersCallback()([{ id: undefined as any, type: 'channel', unreadCount: 5 }]);

      expect(service.unreadCounts().size).toBe(0);
    });

    it('defaults a missing/undefined unreadCount to 0', () => {
      fireServiceSpy.subUnreadCounters.and.returnValue(jasmine.createSpy('unsub'));
      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();

      latestCountersCallback()([{ id: 'chan-1', type: 'channel', unreadCount: undefined as any }]);

      expect(service.unreadCounts().get('chan-1')).toBe(0);
    });
  });

  describe('markAsRead()', () => {
    it('calls fireService.resetUnread when both a user and a chatId are present', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));

      service.markAsRead('chat-1');

      expect(fireServiceSpy.resetUnread).toHaveBeenCalledWith('me', 'chat-1');
    });

    it('does nothing when there is no current user', () => {
      currentUserSignal.set(null);
      service.markAsRead('chat-1');
      expect(fireServiceSpy.resetUnread).not.toHaveBeenCalled();
    });

    it('does nothing when chatId is null', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      service.markAsRead(null);
      expect(fireServiceSpy.resetUnread).not.toHaveBeenCalled();
    });
  });

  describe('auto-mark-as-read effect', () => {
    beforeEach(() => {
      fireServiceSpy.subUnreadCounters.and.returnValue(jasmine.createSpy('unsub'));
    });

    it('marks a channel as read when it is the active chat and has unread messages', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();
      latestCountersCallback()([{ id: 'chan-1', type: 'channel', unreadCount: 2 }]);
      spyOn(service, 'markAsRead');

      activeChatTypeSignal.set('channel');
      activeChatIdSignal.set('chan-1');
      TestBed.flushEffects();

      expect(service.markAsRead).toHaveBeenCalledWith('chan-1');
    });

    it('does not mark a channel as read when its unread count is 0', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();
      latestCountersCallback()([{ id: 'chan-1', type: 'channel', unreadCount: 0 }]);
      spyOn(service, 'markAsRead');

      activeChatTypeSignal.set('channel');
      activeChatIdSignal.set('chan-1');
      TestBed.flushEffects();

      expect(service.markAsRead).not.toHaveBeenCalled();
    });

    it('does not mark as read when the channel is not present in the counters map at all', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();
      latestCountersCallback()([]);
      spyOn(service, 'markAsRead');

      activeChatTypeSignal.set('channel');
      activeChatIdSignal.set('unknown-chan');
      TestBed.flushEffects();

      expect(service.markAsRead).not.toHaveBeenCalled();
    });

    it('resolves a direct chat to its sorted-pair conversationId and marks it as read', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();
      const conversationId = getConversationId('me', 'other-user');
      latestCountersCallback()([{ id: conversationId, type: 'direct', unreadCount: 4 }]);
      spyOn(service, 'markAsRead');

      activeChatTypeSignal.set('direct');
      activeChatIdSignal.set('other-user');
      TestBed.flushEffects();

      expect(service.markAsRead).toHaveBeenCalledWith(conversationId);
    });

    it('does not resolve/mark a direct chat when there is no current user', () => {
      // No current user at all -> resolveActiveChatId returns null for 'direct'.
      spyOn(service, 'markAsRead');

      activeChatTypeSignal.set('direct');
      activeChatIdSignal.set('other-user');
      TestBed.flushEffects();

      expect(service.markAsRead).not.toHaveBeenCalled();
    });

    it('does nothing when activeChatId is null', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();
      spyOn(service, 'markAsRead');

      activeChatTypeSignal.set('channel');
      activeChatIdSignal.set(null);
      TestBed.flushEffects();

      expect(service.markAsRead).not.toHaveBeenCalled();
    });

    it('does nothing when activeChatType is null', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      TestBed.flushEffects();
      spyOn(service, 'markAsRead');

      activeChatIdSignal.set('chan-1');
      activeChatTypeSignal.set(null);
      TestBed.flushEffects();

      expect(service.markAsRead).not.toHaveBeenCalled();
    });
  });
});
