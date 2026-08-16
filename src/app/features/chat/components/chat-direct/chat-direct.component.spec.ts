import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';

import { DirectmessagesComponent } from './chat-direct.component';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { UserStore } from '../../../../shared/services/user/user-store';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { MessagesService } from '../../services/messages/messages.service';
import { ProfileDialogService } from '../../../../shared/services/profile-dialog/profile-dialog.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import { MentionService } from '../../../../shared/services/mention/mention.service';
import { ReactionsService } from '../../services/reactions/reactions.service';

import { stubActivatedRoute } from '../../../../../testing/router-test.util';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { makeUser } from '../../../../../testing/user-fixtures';
import { makeChannelMessage } from '../../../../../testing/message-fixtures';

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

describe('DirectmessagesComponent', () => {
  let fixture: ComponentFixture<DirectmessagesComponent>;
  let component: DirectmessagesComponent;

  let navigationServiceSpy: any;
  let userStoreSpy: jasmine.SpyObj<any>;
  let authServiceSpy: any;
  let messagesServiceSpy: any;
  let profileDialogServiceSpy: jasmine.SpyObj<ProfileDialogService>;
  let searchServiceSpy: jasmine.SpyObj<any>;
  let route: ReturnType<typeof stubActivatedRoute>;
  let unsubSpy: jasmine.Spy;

  const currentUser = makeUser({ id: 'user-1' });
  const otherUser = makeUser({ id: 'user-2', displayName: 'Other User' });

  beforeEach(async () => {
    unsubSpy = jasmine.createSpy('unsubDirectMessages');

    navigationServiceSpy = { isMobile: mockSignal(false) };
    userStoreSpy = jasmine.createSpyObj('UserStore', ['getUserById', 'findUserByDisplayName']);
    userStoreSpy.getUserById.and.resolveTo(otherUser);
    authServiceSpy = { currentUser: mockSignal(currentUser), isGuest: mockSignal(false) };
    messagesServiceSpy = {
      messages: mockSignal([]),
      threadMessages: mockSignal([]),
      subToConversationMessages: jasmine.createSpy('subToConversationMessages').and.returnValue(unsubSpy),
      sendDirectMessage: jasmine.createSpy('sendDirectMessage').and.resolveTo(undefined),
      updateMessageText: jasmine.createSpy('updateMessageText'),
    };
    profileDialogServiceSpy = jasmine.createSpyObj<ProfileDialogService>('ProfileDialogService', ['open']);
    searchServiceSpy = {
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
      resetList: jasmine.createSpy('resetList'),
      closeList: jasmine.createSpy(),
      observeInput: jasmine.createSpy(),
    };

    route = stubActivatedRoute({ id: 'user-2' });

    await TestBed.configureTestingModule({
      imports: [DirectmessagesComponent],
      providers: [
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: UserStore, useValue: userStoreSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MessagesService, useValue: messagesServiceSpy },
        { provide: ProfileDialogService, useValue: profileDialogServiceSpy },
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: ActivatedRoute, useValue: route },
        { provide: MentionService, useValue: jasmine.createSpyObj('MentionService', ['handleMentionClick', 'insertTag', 'formatMentionMarkers']) },
        { provide: ReactionsService, useValue: createReactionsServiceMock() },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(DirectmessagesComponent);
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

  describe('ngOnInit (reads route.paramMap for the recipient id)', () => {
    it('sets currentReceiverId from the route param and loads the receiver + conversation', fakeAsync(() => {
      init();
      tick();

      expect(component.currentReceiverId()).toBe('user-2');
      expect(userStoreSpy.getUserById).toHaveBeenCalledWith('user-2');
      expect(component.currentReceiver()).toEqual(otherUser);
      expect(messagesServiceSpy.subToConversationMessages).toHaveBeenCalledWith('user-1', 'user-2');
    }));

    it('re-subscribes to the new conversation when the route id changes', fakeAsync(() => {
      init();
      tick();
      expect(messagesServiceSpy.subToConversationMessages).toHaveBeenCalledTimes(1);

      route.pushParams({ id: 'user-3' });
      fixture.detectChanges();
      tick();

      expect(unsubSpy).toHaveBeenCalledTimes(1);
      expect(messagesServiceSpy.subToConversationMessages).toHaveBeenCalledWith('user-1', 'user-3');
    }));
  });

  describe('onSend', () => {
    it('delegates to MessagesService.sendDirectMessage with the current receiver id', fakeAsync(() => {
      init();
      tick();
      component.onSend('hi there');
      expect(messagesServiceSpy.sendDirectMessage).toHaveBeenCalledWith('hi there', 'user-2');
    }));
  });

  describe('isUser / isYou', () => {
    it('isUser() is true only for messages sent by the current user', fakeAsync(() => {
      init();
      tick();
      expect(component.isUser({ from: 'user-1' })).toBe(true);
      expect(component.isUser({ from: 'user-2' })).toBe(false);
    }));

    it('isYou() is true only for a self-conversation (receiver === current user)', fakeAsync(() => {
      route.pushParams({ id: 'user-1' });
      init();
      tick();
      expect(component.isYou()).toBe(true);
    }));

    it('isYou() is false for a conversation with someone else', fakeAsync(() => {
      init();
      tick();
      expect(component.isYou()).toBe(false);
    }));
  });

  describe('showProfile', () => {
    it('opens the profile dialog for the current receiver', fakeAsync(() => {
      init();
      tick();
      component.showProfile();
      expect(profileDialogServiceSpy.open).toHaveBeenCalledWith(otherUser);
    }));
  });

  describe('hideList (wired to SearchService.resetList())', () => {
    it('delegates to searchService.resetList()', () => {
      init();
      component.hideList();
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    });

    it('is invoked when the card area is clicked', () => {
      init();
      const card: HTMLElement = fixture.nativeElement.querySelector('app-card');
      card.click();
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    });
  });

  describe('auto-scroll effect on new messages', () => {
    it('scrolls to bottom when near it and new messages arrive', fakeAsync(() => {
      init();
      tick();
      const el: HTMLElement = component.chatContentRef.nativeElement;
      Object.defineProperty(el, 'scrollHeight', { value: 400, configurable: true });
      Object.defineProperty(el, 'clientHeight', { value: 350, configurable: true });
      Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true }); // 400-0-350=50 < 100 => near bottom

      messagesServiceSpy.messages.set([makeChannelMessage()]);
      fixture.detectChanges();
      tick();

      expect(el.scrollTop).toBe(400);
    }));
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes and clears messages', fakeAsync(() => {
      init();
      tick();
      component.ngOnDestroy();
      expect(unsubSpy).toHaveBeenCalled();
      expect(messagesServiceSpy.messages()).toEqual([]);
    }));
  });

  describe('mobile vs desktop header', () => {
    it('renders app-chat-header on mobile', () => {
      navigationServiceSpy.isMobile.set(true);
      init();
      expect(fixture.nativeElement.querySelector('app-chat-header')).toBeTruthy();
    });

    it('does not render app-chat-header on desktop', () => {
      navigationServiceSpy.isMobile.set(false);
      init();
      expect(fixture.nativeElement.querySelector('app-chat-header')).toBeFalsy();
    });
  });

  describe('empty state', () => {
    it('shows the "only between you two" text for a conversation with someone else', fakeAsync(() => {
      init();
      tick();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('findet nur zwischen');
    }));

    it('shows the self-notes text for a self-conversation', fakeAsync(() => {
      route.pushParams({ id: 'user-1' });
      init();
      tick();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Raum ist nur für dich da');
    }));
  });
});
