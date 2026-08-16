import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';

import { ContactbarComponent } from './contactbar.component';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import { MentionService } from '../../../../shared/services/mention/mention.service';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { UnreadService } from '../../../../shared/services/unread/unread.service';
import { AddChannelComponent } from '../../../channel/components/add-channel/add-channel.component';

import { makeUser } from '../../../../../testing/user-fixtures';
import { makeChannel } from '../../../../../testing/channel-fixtures';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { Channel } from '../../../channel/models/channel/channel';
import { User } from '../../../auth/models/user/user';

describe('ContactbarComponent', () => {
  let fixture: ComponentFixture<ContactbarComponent>;
  let component: ContactbarComponent;

  let fireServiceSpy: any;
  let navigationServiceSpy: any;
  let searchServiceSpy: any;
  let authServiceSpy: any;
  let unreadServiceSpy: any;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;

  const currentUser = makeUser({ id: 'user-1' });
  const channels: Channel[] = [makeChannel({ id: 'channel-1', name: 'general' }), makeChannel({ id: 'channel-2', name: 'random' })];
  const users: User[] = [makeUser({ id: 'user-2' }), makeUser({ id: 'user-3' })];

  beforeEach(async () => {
    fireServiceSpy = {
      allUsers: mockSignal<User[]>(users),
      myChannels: mockSignal<Channel[]>(channels),
      subAllUsers: jasmine.createSpy('subAllUsers'),
      subChannels: jasmine.createSpy('subChannels'),
    };

    navigationServiceSpy = {
      isMobile: mockSignal(false),
      isChannelsOpen: mockSignal(true),
      isDirectMessagesOpen: mockSignal(false),
      selectChannel: jasmine.createSpy('selectChannel'),
      selectDirectMessageRecipient: jasmine.createSpy('selectDirectMessageRecipient'),
      goToNewMessage: jasmine.createSpy('goToNewMessage'),
    };

    searchServiceSpy = {
      isChannel: mockSignal<boolean | null>(null),
      getSearchComponent: jasmine.createSpy('getSearchComponent').and.returnValue('header'),
      getHeaderListBoolean: jasmine.createSpy('getHeaderListBoolean').and.returnValue(false),
      getCurrentList: jasmine.createSpy('getCurrentList').and.returnValue([]),
      getHighlightedIndex: jasmine.createSpy('getHighlightedIndex').and.returnValue(-1),
      getHighlightedElement: jasmine.createSpy('getHighlightedElement').and.returnValue(undefined),
      moveHighlightedIndex: jasmine.createSpy('moveHighlightedIndex'),
      handleDropdownKeydown: jasmine.createSpy('handleDropdownKeydown'),
      resetList: jasmine.createSpy('resetList'),
      closeList: jasmine.createSpy('closeList'),
      observeInput: jasmine.createSpy('observeInput'),
    };

    authServiceSpy = {
      currentUser: mockSignal<User | null>(currentUser),
      isGuest: mockSignal(false),
    };

    unreadServiceSpy = {
      unreadCounts: mockSignal(new Map<string, number>()),
      markAsRead: jasmine.createSpy('markAsRead'),
    };

    matDialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    await TestBed.configureTestingModule({
      imports: [ContactbarComponent],
      providers: [
        provideRouter([]),
        { provide: FireServiceService, useValue: fireServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: MentionService, useValue: jasmine.createSpyObj('MentionService', ['resolveTagName']) },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: UnreadService, useValue: unreadServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ContactbarComponent);
    component = fixture.componentInstance;
  });

  it('creates and subscribes to the shared users/channels streams on init', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
    expect(fireServiceSpy.subAllUsers).toHaveBeenCalled();
    expect(fireServiceSpy.subChannels).toHaveBeenCalled();
  });

  describe('mobile vs desktop header branch', () => {
    it('renders the app-header search bar on mobile', () => {
      navigationServiceSpy.isMobile.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-header')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.headline__container')).toBeFalsy();
    });

    it('renders the desktop "Devspace" headline when not mobile', () => {
      navigationServiceSpy.isMobile.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.headline__container')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-header')).toBeFalsy();
    });
  });

  describe('channel list', () => {
    it('renders one entry per channel from firestoreService.myChannels()', () => {
      fixture.detectChanges();
      const items = fixture.nativeElement.querySelectorAll('.dropdown__list__item');
      expect(items.length).toBeGreaterThanOrEqual(channels.length);
      expect(fixture.nativeElement.textContent).toContain('general');
      expect(fixture.nativeElement.textContent).toContain('random');
    });

    it('shows "No Channel found" when there are no channels', () => {
      fireServiceSpy.myChannels.set([]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No Channel found');
    });

    it('calls navigationService.selectChannel(id) when a channel is clicked', () => {
      fixture.detectChanges();
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('.dropdown__list__btn');
      btn.click();
      expect(navigationServiceSpy.selectChannel).toHaveBeenCalledWith('channel-1');
    });
  });

  describe('direct message list', () => {
    it('renders one entry per user from firestoreService.allUsers()', () => {
      fixture.detectChanges();
      const lists = fixture.nativeElement.querySelectorAll('.dropdown__list');
      expect(lists[1].querySelectorAll('.dropdown__list__item').length).toBe(users.length);
    });

    it('calls navigationService.selectDirectMessageRecipient(id) when a DM entry is clicked', () => {
      fixture.detectChanges();
      const lists = fixture.nativeElement.querySelectorAll('.dropdown__list');
      const dmBtn: HTMLButtonElement = lists[1].querySelector('.dropdown__list__btn');
      dmBtn.click();
      expect(navigationServiceSpy.selectDirectMessageRecipient).toHaveBeenCalledWith('user-2');
    });

    it('shows "No User found" when there are no users', () => {
      fireServiceSpy.allUsers.set([]);
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('No User found');
    });
  });

  describe('dmUnreadCount', () => {
    it('returns 0 when there is no current user', () => {
      authServiceSpy.currentUser.set(null);
      fixture.detectChanges();
      expect(component.dmUnreadCount('user-2')).toBe(0);
    });

    it('resolves the conversationId and looks up the unread count', () => {
      const conversationId = ['user-1', 'user-2'].sort().join('_');
      unreadServiceSpy.unreadCounts.set(new Map([[conversationId, 4]]));
      fixture.detectChanges();
      expect(component.dmUnreadCount('user-2')).toBe(4);
    });

    it('returns 0 when there is no entry for the conversation', () => {
      fixture.detectChanges();
      expect(component.dmUnreadCount('user-2')).toBe(0);
    });
  });

  describe('toggleDropdown', () => {
    it('toggles isChannelsOpen for "channels"', () => {
      fixture.detectChanges();
      component.toggleDropdown('channels');
      expect(navigationServiceSpy.isChannelsOpen()).toBe(false);
    });

    it('toggles isDirectMessagesOpen for "directMessages"', () => {
      fixture.detectChanges();
      component.toggleDropdown('directMessages');
      expect(navigationServiceSpy.isDirectMessagesOpen()).toBe(true);
    });
  });

  describe('openAddChannel / guest lock', () => {
    it('opens the AddChannelComponent dialog for a non-guest user', () => {
      authServiceSpy.isGuest.set(false);
      fixture.detectChanges();
      component.openAddChannel();
      expect(matDialogSpy.open).toHaveBeenCalledWith(AddChannelComponent, jasmine.objectContaining({ ariaLabel: 'Channel erstellen' }));
    });

    it('does not open the dialog for a guest user', () => {
      authServiceSpy.isGuest.set(true);
      fixture.detectChanges();
      component.openAddChannel();
      expect(matDialogSpy.open).not.toHaveBeenCalled();
    });

    it('marks the add-channel buttons aria-disabled for a guest user', () => {
      authServiceSpy.isGuest.set(true);
      fixture.detectChanges();
      // aria-disabled lands on ButtonComponent's inner native <button>.
      const addBtn: HTMLElement = fixture.nativeElement.querySelector('.add__channel__btn button');
      expect(addBtn.getAttribute('aria-disabled')).toBe('true');
    });

    it('clicking the guest-disabled "Channel hinzufügen" button does not open the dialog (stopPropagation)', () => {
      authServiceSpy.isGuest.set(true);
      fixture.detectChanges();
      const addBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.add__channel__btn button');
      addBtn.click();
      expect(matDialogSpy.open).not.toHaveBeenCalled();
    });

    it('leaves the add-channel buttons enabled for a non-guest user', () => {
      authServiceSpy.isGuest.set(false);
      fixture.detectChanges();
      const addBtn: HTMLElement = fixture.nativeElement.querySelector('.add__channel__btn button');
      expect(addBtn.hasAttribute('aria-disabled')).toBe(false);
    });
  });

  describe('mobile search dropdown wiring', () => {
    beforeEach(() => navigationServiceSpy.isMobile.set(true));

    it('does not run keydown handling while the header list is closed', () => {
      fixture.detectChanges();
      (component as any).onSearchKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));
      expect(searchServiceSpy.handleDropdownKeydown).not.toHaveBeenCalled();
    });

    it('delegates keydown handling to searchService once the header list is open', () => {
      searchServiceSpy.getHeaderListBoolean.and.returnValue(true);
      fixture.detectChanges();
      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      (component as any).onSearchKeydown(event);
      expect(searchServiceSpy.handleDropdownKeydown).toHaveBeenCalledWith(event, jasmine.any(Function));
    });

    it('activeDescendantId is null while the list is closed and computed once open+highlighted', () => {
      searchServiceSpy.getHeaderListBoolean.and.returnValue(false);
      fixture.detectChanges();
      expect((component as any).activeDescendantId()).toBeNull();

      searchServiceSpy.getHeaderListBoolean.and.returnValue(true);
      searchServiceSpy.getHighlightedIndex.and.returnValue(1);
      fixture.detectChanges();
      expect((component as any).activeDescendantId()).toBe('contactbar-search-listbox-option-1');
    });
  });
});
