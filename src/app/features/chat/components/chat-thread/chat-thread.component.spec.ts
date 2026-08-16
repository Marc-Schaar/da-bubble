import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute, Params } from '@angular/router';
import { BehaviorSubject } from 'rxjs';

import { ThreadComponent } from './chat-thread.component';
import { MessagesService } from '../../services/messages/messages.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { ChannelService } from '../../../channel/services/channel/channel.service';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { ProfileDialogService } from '../../../../shared/services/profile-dialog/profile-dialog.service';
import { UserStore } from '../../../../shared/services/user/user-store';
import { MentionService } from '../../../../shared/services/mention/mention.service';
import { ReactionsService } from '../../services/reactions/reactions.service';
import { SearchService } from '../../../../shared/services/search/search.service';

import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { makeUser } from '../../../../../testing/user-fixtures';
import { makeChannel } from '../../../../../testing/channel-fixtures';
import { makeChannelMessage } from '../../../../../testing/message-fixtures';

/**
 * ThreadComponent reads `route.queryParams` (the plain Params observable),
 * not `queryParamMap` — `src/testing/router-test.util.ts`'s stubActivatedRoute
 * only exposes paramMap/queryParamMap, so a small local stand-in is used here
 * instead (router-test.util.ts is shared/off-limits for this task).
 */
class StubActivatedRouteWithQueryParams {
  private readonly subject: BehaviorSubject<Params>;
  readonly queryParams;

  constructor(initial: Params = {}) {
    this.subject = new BehaviorSubject<Params>(initial);
    this.queryParams = this.subject.asObservable();
  }

  pushQueryParams(params: Params): void {
    this.subject.next(params);
  }
}

/**
 * ReactionsService is rendered into via the real MessageTemplateComponent ->
 * MessageReactionsComponent chain, whose template reads uniqueEmojis()/
 * countUniqueEmojis()/getReactionNamesForEmoji() directly (not just on
 * click), so a plain spy without return-value defaults throws mid-render.
 */
function createReactionsServiceMock() {
  const spy = jasmine.createSpyObj('ReactionsService', [
    'toggleReaction',
    'removeReaction',
    'hasReacted',
    'uniqueEmojis',
    'countEmoji',
    'countUniqueEmojis',
    'getReactionNamesForEmoji',
  ]);
  spy.hasReacted.and.returnValue(false);
  spy.getReactionNamesForEmoji.and.returnValue([]);
  spy.countEmoji.and.returnValue(0);
  spy.uniqueEmojis.and.callFake((reactions: { emoji: string }[]) => reactions.filter((r, i) => i === reactions.findIndex((x) => x.emoji === r.emoji)));
  spy.countUniqueEmojis.and.callFake((reactions: { emoji: string }[]) => new Set(reactions.map((r) => r.emoji)).size);
  return spy;
}

describe('ThreadComponent', () => {
  let fixture: ComponentFixture<ThreadComponent>;
  let component: ThreadComponent;

  let messagesServiceSpy: any;
  let navigationServiceSpy: any;
  let channelServiceSpy: any;
  let authServiceSpy: any;
  let route: StubActivatedRouteWithQueryParams;
  let unsubSpy: jasmine.Spy;

  const currentUser = makeUser();

  beforeEach(async () => {
    unsubSpy = jasmine.createSpy('unsubThreadMessages');

    messagesServiceSpy = {
      messages: mockSignal([]),
      threadMessages: mockSignal([]),
      subToThreadMessages: jasmine.createSpy('subToThreadMessages').and.returnValue(unsubSpy),
      getParentMessage: jasmine.createSpy('getParentMessage').and.resolveTo(null),
      sendThreadMessage: jasmine.createSpy('sendThreadMessage').and.resolveTo(undefined),
      updateMessageText: jasmine.createSpy('updateMessageText'),
    };

    navigationServiceSpy = { isMobile: mockSignal(false), toggleThread: jasmine.createSpy('toggleThread') };
    channelServiceSpy = {
      currentChannel: mockSignal(makeChannel({ id: 'channel-1', name: 'general' })),
      setActiveChannel: jasmine.createSpy('setActiveChannel'),
    };
    authServiceSpy = { currentUser: mockSignal(currentUser), isGuest: mockSignal(false) };

    route = new StubActivatedRouteWithQueryParams({ receiverId: 'channel-1', messageId: 'msg-1' });

    await TestBed.configureTestingModule({
      imports: [ThreadComponent],
      providers: [
        { provide: MessagesService, useValue: messagesServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: ChannelService, useValue: channelServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ActivatedRoute, useValue: route },
        { provide: ProfileDialogService, useValue: jasmine.createSpyObj('ProfileDialogService', ['open']) },
        { provide: UserStore, useValue: jasmine.createSpyObj('UserStore', ['findUserByDisplayName']) },
        { provide: MentionService, useValue: jasmine.createSpyObj('MentionService', ['handleMentionClick', 'insertTag', 'formatMentionMarkers']) },
        { provide: ReactionsService, useValue: createReactionsServiceMock() },
        {
          provide: SearchService,
          useValue: {
            isChannel: mockSignal<boolean | null>(null),
            getSearchComponent: jasmine.createSpy().and.returnValue('textarea'),
            getListBoolean: jasmine.createSpy().and.returnValue(false),
            getHeaderListBoolean: jasmine.createSpy().and.returnValue(false),
            getCurrentList: jasmine.createSpy().and.returnValue([]),
            getHighlightedIndex: jasmine.createSpy().and.returnValue(-1),
            getHighlightedElement: jasmine.createSpy().and.returnValue(undefined),
            getActiveTokenRange: jasmine.createSpy().and.returnValue(null),
            moveHighlightedIndex: jasmine.createSpy(),
            handleDropdownKeydown: jasmine.createSpy(),
            resetList: jasmine.createSpy(),
            closeList: jasmine.createSpy(),
            observeInput: jasmine.createSpy(),
          },
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ThreadComponent);
    component = fixture.componentInstance;
  });

  function init() {
    fixture.detectChanges();
    fixture.detectChanges();
  }

  it('creates', () => {
    init();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit (reads queryParams.messageId / receiverId)', () => {
    it('sets currentChannelId/parentMessageId from query params and fetches the parent message + thread', fakeAsync(() => {
      init();
      tick();

      expect(component.currentChannelId()).toBe('channel-1');
      expect(component.parentMessageId()).toBe('msg-1');
      expect(messagesServiceSpy.getParentMessage).toHaveBeenCalledWith('channel-1', 'msg-1');
      expect(messagesServiceSpy.subToThreadMessages).toHaveBeenCalledWith('channel-1', 'msg-1');
    }));

    it('clears threadMessages and does not subscribe when there is no messageId', fakeAsync(() => {
      route.pushQueryParams({ receiverId: 'channel-1', messageId: '' });
      init();
      tick();

      expect(messagesServiceSpy.subToThreadMessages).not.toHaveBeenCalled();
      expect(messagesServiceSpy.threadMessages()).toEqual([]);
    }));
  });

  describe('re-subscribing when the parent channel changes while the thread stays open (leak fix)', () => {
    it('unsubscribes the previous thread listener and subscribes to the new channel/message', fakeAsync(() => {
      init();
      tick();
      expect(messagesServiceSpy.subToThreadMessages).toHaveBeenCalledTimes(1);

      route.pushQueryParams({ receiverId: 'channel-2', messageId: 'msg-2' });
      fixture.detectChanges();
      tick();

      expect(unsubSpy).toHaveBeenCalledTimes(1);
      expect(messagesServiceSpy.subToThreadMessages).toHaveBeenCalledWith('channel-2', 'msg-2');
      expect(component.currentChannelId()).toBe('channel-2');
      expect(component.parentMessageId()).toBe('msg-2');
    }));
  });

  describe('ngOnDestroy unsubscribes the thread listener (known leak, verify fixed)', () => {
    it('calls the stored unsub function and clears threadMessages', fakeAsync(() => {
      init();
      tick();
      messagesServiceSpy.threadMessages.set([makeChannelMessage()]);

      component.ngOnDestroy();

      expect(unsubSpy).toHaveBeenCalled();
      expect(messagesServiceSpy.threadMessages()).toEqual([]);
    }));

    it('does not throw when destroyed without ever having subscribed', () => {
      expect(() => component.ngOnDestroy()).not.toThrow();
    });
  });

  describe('onSend (reply appends via MessagesService.sendThreadMessage)', () => {
    it('delegates to sendThreadMessage with the current channel/message ids', fakeAsync(() => {
      init();
      tick();
      component.onSend('a reply');
      expect(messagesServiceSpy.sendThreadMessage).toHaveBeenCalledWith('a reply', 'channel-1', 'msg-1');
    }));
  });

  describe('closeThread', () => {
    it('delegates to NavigationService.toggleThread("close")', () => {
      init();
      component.closeThread();
      expect(navigationServiceSpy.toggleThread).toHaveBeenCalledWith('close');
    });
  });

  describe('auto-scroll effect on new thread messages', () => {
    it('scrolls to bottom when the user is near it and new thread messages arrive', fakeAsync(() => {
      init();
      tick();
      const el: HTMLElement = component.chatContentRef.nativeElement;
      Object.defineProperty(el, 'scrollHeight', { value: 300, configurable: true });
      Object.defineProperty(el, 'clientHeight', { value: 250, configurable: true });
      Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true }); // 300-0-250=50 < 100 => near bottom

      messagesServiceSpy.threadMessages.set([makeChannelMessage()]);
      fixture.detectChanges();
      tick();

      expect(el.scrollTop).toBe(300);
    }));
  });

  describe('mobile vs desktop header', () => {
    it('renders app-chat-header with isThread=true on mobile', () => {
      navigationServiceSpy.isMobile.set(true);
      init();
      const header = fixture.nativeElement.querySelector('app-chat-header');
      expect(header).toBeTruthy();
    });

    it('renders the inline close button instead on desktop', () => {
      navigationServiceSpy.isMobile.set(false);
      init();
      expect(fixture.nativeElement.querySelector('app-chat-header')).toBeFalsy();
      expect(fixture.nativeElement.querySelector('[aria-label="Thread schließen"]')).toBeTruthy();
    });
  });

  describe('rendering', () => {
    it('shows the reply count', fakeAsync(() => {
      init();
      tick();
      messagesServiceSpy.threadMessages.set([makeChannelMessage(), makeChannelMessage()]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('2 Antworten');
    }));

    it('renders the parent message via app-message-template when present', fakeAsync(() => {
      const parent = makeChannelMessage({ id: 'msg-1' });
      messagesServiceSpy.getParentMessage.and.resolveTo(parent);
      init();
      tick();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelectorAll('app-message-template').length).toBeGreaterThanOrEqual(1);
    }));
  });
});
