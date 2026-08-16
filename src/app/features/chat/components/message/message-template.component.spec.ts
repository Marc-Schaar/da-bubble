import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageTemplateComponent } from './message-template.component';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { MessagesService } from '../../services/messages/messages.service';
import { ProfileDialogService } from '../../../../shared/services/profile-dialog/profile-dialog.service';
import { UserStore } from '../../../../shared/services/user/user-store';
import { MentionService } from '../../../../shared/services/mention/mention.service';
import { ReactionsService } from '../../services/reactions/reactions.service';

import { makeUser } from '../../../../../testing/user-fixtures';
import { makeChannelMessage, makeDirectMessage } from '../../../../../testing/message-fixtures';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { Reaction } from '../../models/channel-message/channel-message';

describe('MessageTemplateComponent', () => {
  let fixture: ComponentFixture<MessageTemplateComponent>;
  let component: MessageTemplateComponent;

  let authServiceSpy: any;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
  let messagesServiceSpy: jasmine.SpyObj<any>;
  let profileDialogServiceSpy: jasmine.SpyObj<ProfileDialogService>;
  let userStoreSpy: jasmine.SpyObj<any>;
  let mentionServiceSpy: jasmine.SpyObj<MentionService>;
  let reactionsServiceSpy: jasmine.SpyObj<ReactionsService>;

  const me = makeUser({ displayName: 'Marc Owner' });

  beforeEach(async () => {
    authServiceSpy = { currentUser: mockSignal(me) };
    navigationServiceSpy = jasmine.createSpyObj<NavigationService>('NavigationService', ['goToThread', 'selectChannel', 'selectDirectMessageRecipient'], {
      isMobile: mockSignal(false),
    });
    messagesServiceSpy = jasmine.createSpyObj('MessagesService', ['updateMessageText']);
    profileDialogServiceSpy = jasmine.createSpyObj<ProfileDialogService>('ProfileDialogService', ['open']);
    userStoreSpy = jasmine.createSpyObj('UserStore', ['findUserByDisplayName']);
    userStoreSpy.findUserByDisplayName.and.resolveTo(null);
    mentionServiceSpy = jasmine.createSpyObj<MentionService>('MentionService', ['handleMentionClick']);
    reactionsServiceSpy = jasmine.createSpyObj<ReactionsService>('ReactionsService', [
      'toggleReaction',
      'removeReaction',
      'hasReacted',
      'uniqueEmojis',
      'countEmoji',
      'countUniqueEmojis',
      'getReactionNamesForEmoji',
    ]);
    reactionsServiceSpy.hasReacted.and.returnValue(false);
    reactionsServiceSpy.getReactionNamesForEmoji.and.returnValue([]);
    reactionsServiceSpy.countEmoji.and.returnValue(0);
    reactionsServiceSpy.uniqueEmojis.and.callFake((reactions: Reaction[]) => reactions.filter((r, i) => i === reactions.findIndex((x) => x.emoji === r.emoji)));
    reactionsServiceSpy.countUniqueEmojis.and.callFake((reactions: Reaction[]) => new Set(reactions.map((r) => r.emoji)).size);

    await TestBed.configureTestingModule({
      imports: [MessageTemplateComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: MessagesService, useValue: messagesServiceSpy },
        { provide: ProfileDialogService, useValue: profileDialogServiceSpy },
        { provide: UserStore, useValue: userStoreSpy },
        { provide: MentionService, useValue: mentionServiceSpy },
        { provide: ReactionsService, useValue: reactionsServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MessageTemplateComponent);
    component = fixture.componentInstance;
  });

  function setMessage(overrides: Parameters<typeof makeChannelMessage>[0] = {}) {
    fixture.componentRef.setInput('message', makeChannelMessage(overrides));
    fixture.detectChanges();
  }

  /**
   * `menuOpen`/`isEditing` are plain (non-signal) fields, so mutating them
   * directly from a test does not mark this OnPush component dirty for a
   * subsequent `fixture.detectChanges()` — real DOM clicks are required to
   * actually re-render. Drives the real menu-open -> "Nachricht bearbeiten"
   * click sequence instead.
   */
  function enterEditModeViaUi(): void {
    const menuBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Nachrichtenmenü öffnen"]');
    menuBtn.click();
    fixture.detectChanges();
    const menuButtons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.menu button'));
    const editBtn = menuButtons.find((b) => b.textContent?.includes('Nachricht bearbeiten'))!;
    editBtn.click();
    fixture.detectChanges();
  }

  it('creates', () => {
    setMessage();
    expect(component).toBeTruthy();
  });

  describe('isOwnMessage', () => {
    it('is true when the message author matches the current user\'s display name', () => {
      setMessage({ name: me.displayName });
      expect(component.isOwnMessage()).toBe(true);
    });

    it('is false for a message from someone else', () => {
      setMessage({ name: 'Someone Else' });
      expect(component.isOwnMessage()).toBe(false);
    });

    it('only renders the own-message action menu button for own messages', () => {
      setMessage({ name: me.displayName });
      expect(fixture.nativeElement.querySelector('[aria-label="Nachrichtenmenü öffnen"]')).toBeTruthy();

      setMessage({ name: 'Someone Else' });
      expect(fixture.nativeElement.querySelector('[aria-label="Nachrichtenmenü öffnen"]')).toBeFalsy();
    });
  });

  describe('isChannelMessage', () => {
    it('is true for a ChannelMessage', () => {
      setMessage();
      expect(component.isChannelMessage()).toBe(true);
    });

    it('is false for a DirectMessage', () => {
      fixture.componentRef.setInput('message', makeDirectMessage());
      fixture.detectChanges();
      expect(component.isChannelMessage()).toBe(false);
    });
  });

  describe('edit mode', () => {
    it('editMessage() enters edit mode, seeds inputEdit and closes the actions menu', () => {
      setMessage({ name: me.displayName, message: 'hello world' });
      component.menuOpen = true;

      component.editMessage(component.message());

      expect(component.isEditing).toBe(true);
      expect(component.inputEdit).toBe('hello world');
      expect(component.menuOpen).toBe(false);
    });

    it('updateMessage() saves via MessagesService.updateMessageText and exits edit mode', () => {
      setMessage({ name: me.displayName, message: 'hello world' });
      fixture.componentRef.setInput('currentChannelId', 'channel-1');
      fixture.componentRef.setInput('parentMessageId', 'parent-1');
      fixture.componentRef.setInput('isThread', true);
      fixture.detectChanges();
      component.editMessage(component.message());
      component.inputEdit = 'edited text';

      component.updateMessage(component.message());

      expect(messagesServiceSpy.updateMessageText).toHaveBeenCalledWith(
        component.message().id,
        'edited text',
        jasmine.objectContaining({ channelId: 'channel-1', parentMessageId: 'parent-1', isThread: true }),
      );
      expect(component.isEditing).toBe(false);
      expect(component.inputEdit).toBe('');
    });

    it('cancel() exits edit mode and closes the actions menu without saving', () => {
      setMessage({ name: me.displayName });
      component.editMessage(component.message());
      component.menuOpen = true;

      component.cancel();

      expect(component.isEditing).toBe(false);
      expect(component.menuOpen).toBe(false);
      expect(messagesServiceSpy.updateMessageText).not.toHaveBeenCalled();
    });

    it('renders the edit textarea instead of the message body while editing', () => {
      setMessage({ name: me.displayName, message: 'hello' });
      enterEditModeViaUi();

      expect(fixture.nativeElement.querySelector('textarea')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('.message-main')).toBeFalsy();
    });

    it('wires Speichern/Abbrechen buttons to updateMessage()/cancel()', () => {
      setMessage({ name: me.displayName, message: 'hello' });
      enterEditModeViaUi();

      const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.action-container button'));
      const cancelBtn = buttons.find((b) => b.textContent?.includes('Abbrechen'))!;
      const saveBtn = buttons.find((b) => b.textContent?.includes('Speichern'))!;

      saveBtn.click();
      fixture.detectChanges();
      expect(messagesServiceSpy.updateMessageText).toHaveBeenCalled();

      enterEditModeViaUi();
      const buttons2: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('.action-container button'));
      const cancelBtn2 = buttons2.find((b) => b.textContent?.includes('Abbrechen'))!;
      cancelBtn2.click();
      expect(component.isEditing).toBe(false);
    });
  });

  describe('mention click delegation', () => {
    it('delegates paragraph clicks to MentionService.handleMentionClick', () => {
      setMessage({ message: 'hi @someone' });
      const p: HTMLElement = fixture.nativeElement.querySelector('.message-main');
      p.click();
      expect(mentionServiceSpy.handleMentionClick).toHaveBeenCalled();
    });
  });

  describe('thread open button', () => {
    it('calls navigationService.goToThread(messageId, currentChannelId) when not already in a thread', () => {
      setMessage();
      fixture.componentRef.setInput('currentChannelId', 'channel-1');
      fixture.componentRef.setInput('isThread', false);
      fixture.detectChanges();

      const threadBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Thread öffnen"]');
      expect(threadBtn).toBeTruthy();
      threadBtn.click();

      expect(navigationServiceSpy.goToThread).toHaveBeenCalledWith(component.message().id, 'channel-1');
    });

    it('hides the "Thread öffnen" button while already inside a thread', () => {
      setMessage();
      fixture.componentRef.setInput('isThread', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[aria-label="Thread öffnen"]')).toBeFalsy();
    });
  });

  describe('reaction toggling', () => {
    it('toggleReaction() delegates to ReactionsService for a ChannelMessage and closes the reaction menu', () => {
      setMessage();
      component.reactionMenuOpen = true;

      component.toggleReaction('checkMark');

      expect(reactionsServiceSpy.toggleReaction).toHaveBeenCalledWith(
        component.message() as any,
        'checkMark',
        jasmine.objectContaining({ channelId: '', isThread: false }),
      );
      expect(component.reactionMenuOpen).toBe(false);
    });

    it('does not call ReactionsService.toggleReaction for a DirectMessage', () => {
      fixture.componentRef.setInput('message', makeDirectMessage());
      fixture.detectChanges();
      component.toggleReaction('checkMark');
      expect(reactionsServiceSpy.toggleReaction).not.toHaveBeenCalled();
    });

    it('hasReacted() delegates to ReactionsService.hasReacted with this message\'s reactions', () => {
      setMessage({ reaction: [{ emoji: '✅', from: 'x' }] });
      component.hasReacted('✅');
      expect(reactionsServiceSpy.hasReacted).toHaveBeenCalledWith('✅', component.reactions());
    });
  });

  describe('toggleMenu / toggleReactionMenu mutual exclusivity', () => {
    it('opening the actions menu closes the reaction menu', () => {
      setMessage({ name: me.displayName });
      component.reactionMenuOpen = true;
      component.toggleMenu();
      expect(component.menuOpen).toBe(true);
      expect(component.reactionMenuOpen).toBe(false);
    });

    it('opening the reaction menu closes the actions menu', () => {
      setMessage({ name: me.displayName });
      component.menuOpen = true;
      component.toggleReactionMenu();
      expect(component.reactionMenuOpen).toBe(true);
      expect(component.menuOpen).toBe(false);
    });

    it('toggling again closes the respective menu', () => {
      setMessage({ name: me.displayName });
      component.toggleMenu();
      component.toggleMenu();
      expect(component.menuOpen).toBe(false);
    });
  });

  describe('actions-menu close-on-outside-click (document:click HostListener)', () => {
    it('closes the open actions menu when a click occurs outside of it', () => {
      setMessage({ name: me.displayName });
      component.toggleMenu();
      fixture.detectChanges();
      expect(component.menuOpen).toBe(true);

      const outside = document.createElement('div');
      document.body.appendChild(outside);
      outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      document.body.removeChild(outside);

      expect(component.menuOpen).toBe(false);
    });

    it('does not close the actions menu when the click happens inside its popup', () => {
      setMessage({ name: me.displayName });
      const menuBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Nachrichtenmenü öffnen"]');
      menuBtn.click();
      fixture.detectChanges();

      const popup: HTMLElement = fixture.nativeElement.querySelector('.menu');
      expect(popup).toBeTruthy();
      popup.dispatchEvent(new MouseEvent('click', { bubbles: true }));

      expect(component.menuOpen).toBe(true);
    });

    it('does not close the reaction menu when the click happens on its own toggle button', () => {
      setMessage();
      // A single real click both opens the menu (via the button's own (click)
      // handler) and bubbles to the document HostListener, which must not
      // treat a click on the toggle button itself as "outside".
      const reactionBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Reaktion auswählen"]');
      reactionBtn.click();
      fixture.detectChanges();

      expect(component.reactionMenuOpen).toBe(true);
    });
  });

  describe('showProfile', () => {
    it('resolves the author by display name and opens the profile dialog', async () => {
      const author = makeUser({ displayName: 'Some Author' });
      userStoreSpy.findUserByDisplayName.and.resolveTo(author);
      setMessage({ name: 'Some Author' });

      await component.showProfile();

      expect(userStoreSpy.findUserByDisplayName).toHaveBeenCalledWith('Some Author');
      expect(profileDialogServiceSpy.open).toHaveBeenCalledWith(author);
    });

    it('opens with null when no matching user is found', async () => {
      userStoreSpy.findUserByDisplayName.and.resolveTo(null);
      setMessage({ name: 'Ghost' });

      await component.showProfile();

      expect(profileDialogServiceSpy.open).toHaveBeenCalledWith(null);
    });
  });

  describe('message-reactions wiring', () => {
    it('renders app-message-reactions for a channel message when channelType is not "direct"', () => {
      setMessage();
      expect(fixture.nativeElement.querySelector('app-message-reactions')).toBeTruthy();
    });

    it('does not render app-message-reactions when channelType is "direct"', () => {
      setMessage();
      fixture.componentRef.setInput('channelType', 'direct');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-message-reactions')).toBeFalsy();
    });

    it('does not render app-message-reactions for a DirectMessage', () => {
      fixture.componentRef.setInput('message', makeDirectMessage());
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-message-reactions')).toBeFalsy();
    });
  });

  describe('showActions / reaction bar visibility', () => {
    it('renders the hover reaction bar by default', () => {
      setMessage();
      expect(fixture.nativeElement.querySelector('.reaction-bar')).toBeTruthy();
    });

    it('hides the reaction bar when showActions=false', () => {
      setMessage();
      fixture.componentRef.setInput('showActions', false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.reaction-bar')).toBeFalsy();
    });

    it('hides the reaction bar for direct-message channelType', () => {
      setMessage();
      fixture.componentRef.setInput('channelType', 'direct');
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.reaction-bar')).toBeFalsy();
    });

    it('hides the reaction bar while editing', () => {
      setMessage({ name: me.displayName });
      enterEditModeViaUi();
      expect(fixture.nativeElement.querySelector('.reaction-bar')).toBeFalsy();
    });
  });
});
