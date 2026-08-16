import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { ChatContentComponent } from './chat-channel.component';
import { ChannelService } from '../../../channel/services/channel/channel.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { MessagesService } from '../../services/messages/messages.service';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { ProfileDialogService } from '../../../../shared/services/profile-dialog/profile-dialog.service';
import { UserStore } from '../../../../shared/services/user/user-store';
import { MentionService } from '../../../../shared/services/mention/mention.service';
import { ReactionsService } from '../../services/reactions/reactions.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import { EditChannelComponent } from '../../../channel/components/edit-channel/edit-channel.component';
import { AddMemberComponent } from '../../../channel/components/add-member/add-member.component';

import { stubActivatedRoute } from '../../../../../testing/router-test.util';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { makeUser } from '../../../../../testing/user-fixtures';
import { makeChannel } from '../../../../../testing/channel-fixtures';
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

describe('ChatContentComponent', () => {
  let fixture: ComponentFixture<ChatContentComponent>;
  let component: ChatContentComponent;

  let channelServiceSpy: any;
  let navigationServiceSpy: any;
  let messagesServiceSpy: any;
  let authServiceSpy: any;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;
  let route: ReturnType<typeof stubActivatedRoute>;
  let unsubSpy: jasmine.Spy;

  const currentUser = makeUser();

  beforeEach(async () => {
    unsubSpy = jasmine.createSpy('unsubMessages');

    channelServiceSpy = {
      currentChannel: mockSignal(makeChannel({ id: 'channel-1', name: 'general', member: [{ id: 'user-1' }] })),
      enrichedMembers: mockSignal([]),
      setActiveChannel: jasmine.createSpy('setActiveChannel'),
    };

    navigationServiceSpy = { isMobile: mockSignal(false) };

    messagesServiceSpy = {
      messages: mockSignal([]),
      threadMessages: mockSignal([]),
      subToMessages: jasmine.createSpy('subToMessages').and.returnValue(unsubSpy),
      sendChannelMessage: jasmine.createSpy('sendChannelMessage').and.resolveTo(undefined),
      updateMessageText: jasmine.createSpy('updateMessageText'),
    };

    authServiceSpy = { currentUser: mockSignal(currentUser), isGuest: mockSignal(false) };

    matDialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    route = stubActivatedRoute({ id: 'channel-1' });

    await TestBed.configureTestingModule({
      imports: [ChatContentComponent],
      providers: [
        { provide: ChannelService, useValue: channelServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: MessagesService, useValue: messagesServiceSpy },
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

    // Overridden separately (rather than via `providers` above): ChatContentComponent
    // imports MatDialogModule directly, and a plain `providers` entry for MatDialog
    // was observed to still let the *real* MatDialog through, actually instantiating
    // the dialog's content component. overrideProvider reliably wins.
    TestBed.overrideProvider(MatDialog, { useValue: matDialogSpy });

    fixture = TestBed.createComponent(ChatContentComponent);
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

  describe('single-source-of-truth active channel (no local onSnapshot)', () => {
    it('sets currentChannelId from the route id and delegates to ChannelService.setActiveChannel + MessagesService.subToMessages', () => {
      init();
      expect(component.currentChannelId()).toBe('channel-1');
      expect(channelServiceSpy.setActiveChannel).toHaveBeenCalledWith('channel-1');
      expect(messagesServiceSpy.subToMessages).toHaveBeenCalledWith('channel-1');
    });

    it('unsubscribes the previous channel subscription and resubscribes when the route id changes', () => {
      init();
      expect(messagesServiceSpy.subToMessages).toHaveBeenCalledTimes(1);

      route.pushParams({ id: 'channel-2' });
      fixture.detectChanges();
      fixture.detectChanges();

      expect(unsubSpy).toHaveBeenCalledTimes(1);
      expect(channelServiceSpy.setActiveChannel).toHaveBeenCalledWith('channel-2');
      expect(messagesServiceSpy.subToMessages).toHaveBeenCalledWith('channel-2');
    });

    it('clears the active channel and does not subscribe when there is no route id', () => {
      route.pushParams({});
      init();

      expect(channelServiceSpy.setActiveChannel).toHaveBeenCalledWith(null);
    });
  });

  describe('auto-scroll effect on new messages', () => {
    it('scrolls the chat content to the bottom when the user is near it and new messages arrive', fakeAsync(() => {
      init();
      const el: HTMLElement = component.chatContentRef.nativeElement;
      // Plain data properties (not the native accessors) so the browser's real
      // scroll clamping (which would otherwise clamp scrollTop back to 0 since
      // there's no genuine overflow in this unstyled test DOM) doesn't apply.
      Object.defineProperty(el, 'scrollHeight', { value: 500, configurable: true });
      Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true });
      Object.defineProperty(el, 'scrollTop', { value: 150, writable: true, configurable: true }); // 500-150-400=-50 < 100 => near bottom

      messagesServiceSpy.messages.set([makeChannelMessage()]);
      fixture.detectChanges();
      tick();

      expect(el.scrollTop).toBe(500);
    }));

    it('does not force-scroll when the user has scrolled away from the bottom', fakeAsync(() => {
      init();
      const el: HTMLElement = component.chatContentRef.nativeElement;
      Object.defineProperty(el, 'scrollHeight', { value: 2000, configurable: true });
      Object.defineProperty(el, 'clientHeight', { value: 400, configurable: true });
      Object.defineProperty(el, 'scrollTop', { value: 0, writable: true, configurable: true }); // 2000-0-400=1600 >= 100 => not near bottom

      messagesServiceSpy.messages.set([makeChannelMessage()]);
      fixture.detectChanges();
      tick();

      expect(el.scrollTop).toBe(0);
    }));
  });

  describe('openChannelInfo (member window guest lock)', () => {
    it('opens EditChannelComponent for a non-guest user', () => {
      authServiceSpy.isGuest.set(false);
      init();
      component.openChannelInfo();
      expect(matDialogSpy.open).toHaveBeenCalledWith(EditChannelComponent, jasmine.objectContaining({ ariaLabel: 'Channel # general bearbeiten' }));
    });

    it('does nothing for a guest user', () => {
      authServiceSpy.isGuest.set(true);
      init();
      component.openChannelInfo();
      expect(matDialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('openMemberWindow (guest lock)', () => {
    it('opens AddMemberComponent for a non-guest user', () => {
      authServiceSpy.isGuest.set(false);
      init();
      component.openMemberWindow();
      expect(matDialogSpy.open).toHaveBeenCalledWith(AddMemberComponent, jasmine.objectContaining({ ariaLabel: 'Mitglieder hinzufügen' }));
    });

    it('does nothing for a guest user', () => {
      authServiceSpy.isGuest.set(true);
      init();
      component.openMemberWindow();
      expect(matDialogSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('onSend', () => {
    it('delegates to MessagesService.sendChannelMessage with the current channel id', () => {
      init();
      component.onSend('hello');
      expect(messagesServiceSpy.sendChannelMessage).toHaveBeenCalledWith('hello', 'channel-1');
    });
  });

  describe('ngOnDestroy', () => {
    it('unsubscribes, clears messages and clears the active channel', () => {
      init();
      component.ngOnDestroy();

      expect(unsubSpy).toHaveBeenCalled();
      expect(messagesServiceSpy.messages()).toEqual([]);
      expect(channelServiceSpy.setActiveChannel).toHaveBeenCalledWith(null);
    });
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
});
