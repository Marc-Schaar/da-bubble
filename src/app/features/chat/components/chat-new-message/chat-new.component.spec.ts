import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { NewmessageComponent } from './chat-new.component';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { MessagesService } from '../../services/messages/messages.service';
import { MentionService } from '../../../../shared/services/mention/mention.service';

import { makeUser } from '../../../../../testing/user-fixtures';
import { makeChannel } from '../../../../../testing/channel-fixtures';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';

describe('NewmessageComponent', () => {
  let fixture: ComponentFixture<NewmessageComponent>;
  let component: NewmessageComponent;

  let navigationServiceSpy: any;
  let searchServiceSpy: jasmine.SpyObj<any>;
  let authServiceSpy: any;
  let messagesServiceSpy: any;

  beforeEach(async () => {
    navigationServiceSpy = {
      isMobile: mockSignal(false),
      selectChannel: jasmine.createSpy('selectChannel'),
      selectDirectMessageRecipient: jasmine.createSpy('selectDirectMessageRecipient'),
    };

    searchServiceSpy = {
      isChannel: mockSignal<boolean | null>(null),
      getSearchComponent: jasmine.createSpy().and.returnValue('newMessage'),
      getNewListBoolean: jasmine.createSpy('getNewListBoolean').and.returnValue(false),
      getCurrentList: jasmine.createSpy().and.returnValue([]),
      getHighlightedIndex: jasmine.createSpy().and.returnValue(-1),
      getHighlightedElement: jasmine.createSpy().and.returnValue(undefined),
      moveHighlightedIndex: jasmine.createSpy(),
      handleDropdownKeydown: jasmine.createSpy('handleDropdownKeydown'),
      resetList: jasmine.createSpy('resetList'),
      closeList: jasmine.createSpy(),
      observeInput: jasmine.createSpy('observeInput'),
      getListBoolean: jasmine.createSpy().and.returnValue(false),
      getActiveTokenRange: jasmine.createSpy().and.returnValue(null),
    };

    authServiceSpy = { currentUser: mockSignal(makeUser()) };

    messagesServiceSpy = {
      sendChannelMessage: jasmine.createSpy('sendChannelMessage').and.resolveTo(undefined),
      sendDirectMessage: jasmine.createSpy('sendDirectMessage').and.resolveTo(undefined),
    };

    await TestBed.configureTestingModule({
      imports: [NewmessageComponent],
      providers: [
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MessagesService, useValue: messagesServiceSpy },
        { provide: MentionService, useValue: jasmine.createSpyObj('MentionService', ['handleMentionClick', 'insertTag', 'formatMentionMarkers', 'resolveTagName']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(NewmessageComponent);
    component = fixture.componentInstance;
  });

  it('creates with a single @Component decorator (no stray @Injectable)', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    // Regression guard: the component must be usable as a plain declarable/creatable
    // component; a stray class-level @Injectable() decorator alongside @Component
    // previously broke DI resolution for this component.
    expect(() => TestBed.createComponent(NewmessageComponent)).not.toThrow();
  });

  describe('onSearchKeydown', () => {
    it('does nothing while the receiver dropdown is closed', () => {
      fixture.detectChanges();
      (component as any).onSearchKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(searchServiceSpy.handleDropdownKeydown).not.toHaveBeenCalled();
    });

    it('delegates to searchService.handleDropdownKeydown while the dropdown is open', () => {
      searchServiceSpy.getNewListBoolean.and.returnValue(true);
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      (component as any).onSearchKeydown(event);
      expect(searchServiceSpy.handleDropdownKeydown).toHaveBeenCalledWith(event, jasmine.any(Function));
    });
  });

  describe('activeDescendantId', () => {
    it('is null while the dropdown is closed', () => {
      fixture.detectChanges();
      expect((component as any).activeDescendantId()).toBeNull();
    });

    it('is computed from the listbox id once open and highlighted', () => {
      searchServiceSpy.getNewListBoolean.and.returnValue(true);
      searchServiceSpy.getHighlightedIndex.and.returnValue(3);
      fixture.detectChanges();
      expect((component as any).activeDescendantId()).toBe('chat-new-receiver-listbox-option-3');
    });
  });

  describe('setReceiver (via search-result picking)', () => {
    it('sets a channel receiver, its id/type and resets the search list', fakeAsync(() => {
      fixture.detectChanges();
      const channel = makeChannel({ id: 'channel-9', name: 'general' });

      component.setReceiver(channel);
      tick();

      expect(component.currentReceiver).toBe(channel);
      expect(component.getReceiverId()).toBe('channel-9');
      expect(component.getReceiverType()).toBe('channel');
      expect(component.getReceiverName()).toBe('general');
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    }));

    it('sets a user receiver, its id/type and resets the search list', fakeAsync(() => {
      fixture.detectChanges();
      const user = makeUser({ id: 'user-9', displayName: 'Nina' });

      component.setReceiver(user);
      tick();

      expect(component.currentReceiver).toBe(user);
      expect(component.getReceiverId()).toBe('user-9');
      expect(component.getReceiverType()).toBe('direct');
      expect(component.getReceiverName()).toBe('Nina');
    }));

    it('getReceiverName() returns an empty string when nothing is selected yet', () => {
      fixture.detectChanges();
      expect(component.getReceiverName()).toBe('');
    });
  });

  describe('onSend', () => {
    it('sends a channel message and navigates to the channel when the receiver is a channel', fakeAsync(() => {
      fixture.detectChanges();
      component.setReceiver(makeChannel({ id: 'channel-9' }));
      tick();

      component.onSend('hello');
      tick();

      expect(messagesServiceSpy.sendChannelMessage).toHaveBeenCalledWith('hello', 'channel-9');
      expect(navigationServiceSpy.selectChannel).toHaveBeenCalledWith('channel-9');
      expect(messagesServiceSpy.sendDirectMessage).not.toHaveBeenCalled();
    }));

    it('sends a direct message and navigates to the DM when the receiver is a user', fakeAsync(() => {
      fixture.detectChanges();
      component.setReceiver(makeUser({ id: 'user-9' }));
      tick();

      component.onSend('hi');
      tick();

      expect(messagesServiceSpy.sendDirectMessage).toHaveBeenCalledWith('hi', 'user-9');
      expect(navigationServiceSpy.selectDirectMessageRecipient).toHaveBeenCalledWith('user-9');
      expect(messagesServiceSpy.sendChannelMessage).not.toHaveBeenCalled();
    }));

    it('does nothing when no receiver has been chosen', fakeAsync(() => {
      fixture.detectChanges();
      component.onSend('hello');
      tick();

      expect(messagesServiceSpy.sendChannelMessage).not.toHaveBeenCalled();
      expect(messagesServiceSpy.sendDirectMessage).not.toHaveBeenCalled();
    }));
  });

  describe('textarea disabled state', () => {
    it('disables the textarea send while no receiver is chosen', () => {
      fixture.detectChanges();
      const sendBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-send button');
      expect(sendBtn.disabled).toBe(true);
    });

    it('enables the textarea input once a receiver is chosen', fakeAsync(() => {
      fixture.detectChanges();
      component.setReceiver(makeChannel({ id: 'channel-9' }));
      tick();
      fixture.detectChanges();

      const textarea: HTMLTextAreaElement = fixture.nativeElement.querySelector('textarea');
      textarea.value = 'hi';
      textarea.dispatchEvent(new Event('input'));
      fixture.detectChanges();

      const sendBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-send button');
      expect(sendBtn.disabled).toBe(false);
    }));
  });

  describe('mobile vs desktop header', () => {
    it('renders app-chat-header on mobile', () => {
      navigationServiceSpy.isMobile.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-chat-header')).toBeTruthy();
    });

    it('does not render app-chat-header on desktop', () => {
      navigationServiceSpy.isMobile.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-chat-header')).toBeFalsy();
    });
  });

  describe('receiver dropdown visibility', () => {
    it('does not render app-search-result while closed', () => {
      searchServiceSpy.getNewListBoolean.and.returnValue(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-search-result')).toBeFalsy();
    });

    it('renders app-search-result while open', () => {
      searchServiceSpy.getNewListBoolean.and.returnValue(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-search-result')).toBeTruthy();
    });
  });
});
