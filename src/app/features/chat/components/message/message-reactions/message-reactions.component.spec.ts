import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MessageReactionsComponent } from './message-reactions.component';
import { ReactionsService } from '../../../services/reactions/reactions.service';
import { NavigationService } from '../../../../../shared/services/navigation/navigation.service';
import { Reaction } from '../../../models/channel-message/channel-message';
import { makeChannelMessage } from '../../../../../../testing/message-fixtures';
import { mockSignal } from '../../../../../../testing/signal-service-mock.util';
import { PRESELECTED_EMOJIS } from '../../../../../shared/constants';

describe('MessageReactionsComponent', () => {
  let fixture: ComponentFixture<MessageReactionsComponent>;
  let component: MessageReactionsComponent;
  let reactionsServiceSpy: jasmine.SpyObj<ReactionsService>;
  let isMobileSignal: ReturnType<typeof mockSignal<boolean>>;

  const rawReactions: Reaction[] = [
    { emoji: '\u{1F44D}', from: 'user-1' }, // thumbsUp, current user reacted
    { emoji: '\u{1F44D}', from: 'user-2' },
    { emoji: '\u{1F680}', from: 'user-2' }, // rocket, current user did NOT react
    { emoji: '\u{1F600}', from: 'user-1' }, // grinning, current user reacted
  ];
  const uniqueReactions: Reaction[] = [
    { emoji: '\u{1F44D}', from: 'user-1' },
    { emoji: '\u{1F680}', from: 'user-2' },
    { emoji: '\u{1F600}', from: 'user-1' },
  ];

  function setup(
    overrides: {
      isMobile?: boolean;
      reaction?: Reaction[];
      unique?: Reaction[];
      getReactionNamesForEmoji?: (emoji: string, reactions: Reaction[]) => string[];
    } = {},
  ) {
    isMobileSignal = mockSignal(overrides.isMobile ?? true);
    const reaction = overrides.reaction ?? rawReactions;
    const unique = overrides.unique ?? (overrides.reaction ? overrides.reaction : uniqueReactions);

    reactionsServiceSpy = jasmine.createSpyObj<ReactionsService>('ReactionsService', [
      'toggleReaction',
      'hasReacted',
      'uniqueEmojis',
      'countEmoji',
      'countUniqueEmojis',
      'getReactionNamesForEmoji',
    ]);
    reactionsServiceSpy.uniqueEmojis.and.returnValue(unique);
    reactionsServiceSpy.countUniqueEmojis.and.returnValue(unique.length);
    reactionsServiceSpy.hasReacted.and.callFake((emoji: string, reactions: Reaction[]) =>
      reactions.some((r) => r.emoji === emoji && r.from === 'user-1'),
    );
    reactionsServiceSpy.countEmoji.and.callFake((emoji: string, reactions: Reaction[]) => reactions.filter((r) => r.emoji === emoji).length);
    reactionsServiceSpy.getReactionNamesForEmoji.and.callFake(overrides.getReactionNamesForEmoji ?? (() => []));

    const navigationServiceSpy = {} as jasmine.SpyObj<NavigationService>;
    (navigationServiceSpy as any).isMobile = isMobileSignal;

    TestBed.configureTestingModule({
      imports: [MessageReactionsComponent],
      providers: [
        { provide: ReactionsService, useValue: reactionsServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MessageReactionsComponent);
    component = fixture.componentInstance;
    const message = makeChannelMessage({ reaction });
    fixture.componentRef.setInput('message', message);
    fixture.componentRef.setInput('currentChannelId', 'channel-1');
    fixture.componentRef.setInput('parentMessageId', 'parent-1');
    fixture.componentRef.setInput('isThread', true);
    document.body.appendChild(fixture.nativeElement);
    fixture.detectChanges();
    return message;
  }

  afterEach(() => {
    fixture?.nativeElement.remove();
  });

  it('should create', () => {
    setup();
    expect(component).toBeTruthy();
  });

  it('renders one emoji chip per unique emoji (visibleLimit=2 on mobile clips to the first two)', () => {
    setup({ isMobile: true });
    const chips = fixture.nativeElement.querySelectorAll('.emoji-box[type="button"]');
    expect(chips.length).toBe(2);
    expect(chips[0].querySelector('span')?.textContent).toBe(uniqueReactions[0].emoji);
    expect(chips[1].querySelector('span')?.textContent).toBe(uniqueReactions[1].emoji);
  });

  it('renders every unique emoji when not clipped (desktop visibleLimit=20)', () => {
    setup({ isMobile: false });
    const chips = fixture.nativeElement.querySelectorAll('.emoji-box[type="button"]');
    expect(chips.length).toBe(uniqueReactions.length);
  });

  it('shows the reaction count per chip via reactionsService.countEmoji', () => {
    setup({ isMobile: false });
    const chips: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.emoji-box[type="button"]');
    // thumbsUp appears twice in rawReactions
    expect(chips[0].querySelectorAll('span')[1].textContent).toBe('2');
  });

  it('marks reacted chips with bg-purple and aria-pressed=true, per hasReacted', () => {
    setup({ isMobile: false });
    const chips: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.emoji-box[type="button"]');
    // thumbsUp: current user (user-1) reacted -> true
    expect(chips[0].classList.contains('bg-purple')).toBeTrue();
    expect(chips[0].getAttribute('aria-pressed')).toBe('true');
    // rocket: current user did not react -> false
    expect(chips[1].classList.contains('bg-purple')).toBeFalse();
    expect(chips[1].getAttribute('aria-pressed')).toBe('false');
  });

  it('clicking a chip calls toggleReaction with the message, emoji and the context built from its inputs', () => {
    const message = setup({ isMobile: false });
    const chips: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.emoji-box[type="button"]');
    chips[1].click();

    expect(reactionsServiceSpy.toggleReaction).toHaveBeenCalledOnceWith(message, uniqueReactions[1].emoji, {
      channelId: 'channel-1',
      parentMessageId: 'parent-1',
      isThread: true,
    });
  });

  it('renders the reactor names returned by getReactionNamesForEmoji for each chip', () => {
    setup({
      isMobile: false,
      getReactionNamesForEmoji: (emoji) => (emoji === uniqueReactions[0].emoji ? ['Du', 'und du'] : []),
    });

    const chips: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('.emoji-box[type="button"]');
    const names = chips[0].querySelectorAll('.reaction-from-dialog strong');
    expect(Array.from(names).map((n) => n.textContent)).toEqual(['Du', 'und du']);
  });

  it('calls getReactionNamesForEmoji with the chip emoji and the raw reactions array', () => {
    const message = setup({ isMobile: false });
    expect(reactionsServiceSpy.getReactionNamesForEmoji).toHaveBeenCalledWith(uniqueReactions[0].emoji, message.reaction);
    expect(reactionsServiceSpy.getReactionNamesForEmoji).toHaveBeenCalledWith(uniqueReactions[1].emoji, message.reaction);
  });

  describe('"weitere" / "Weniger anzeigen" collapse toggle', () => {
    it('shows a "N weitere" button when chips are clipped, and expands the list on click', () => {
      setup({ isMobile: true }); // visibleLimit=2, 3 unique emojis -> hiddenCount=1
      let moreBtn = Array.from(fixture.nativeElement.querySelectorAll('app-button')).find((el: any) =>
        el.textContent?.includes('weitere'),
      ) as HTMLElement;
      expect(moreBtn?.textContent?.trim()).toBe('1 weitere');

      moreBtn.querySelector('button')!.click();
      fixture.detectChanges();

      const chips = fixture.nativeElement.querySelectorAll('.emoji-box[type="button"]');
      expect(chips.length).toBe(uniqueReactions.length);
    });

    it('shows "Weniger anzeigen" once expanded (raw reaction count exceeds the mobile limit) and collapses back on click', () => {
      setup({ isMobile: true });
      component.showAllReactions.set(true);
      fixture.detectChanges();

      let lessBtn = Array.from(fixture.nativeElement.querySelectorAll('app-button')).find((el: any) =>
        el.textContent?.includes('Weniger anzeigen'),
      ) as HTMLElement;
      expect(lessBtn).toBeTruthy();

      lessBtn.querySelector('button')!.click();
      fixture.detectChanges();

      expect(component.showAllReactions()).toBeFalse();
      const chips = fixture.nativeElement.querySelectorAll('.emoji-box[type="button"]');
      expect(chips.length).toBe(2);
    });
  });

  describe('quick reaction menu', () => {
    it('renders the "add reaction" trigger only when there are existing reactions', () => {
      setup({ isMobile: false });
      expect(fixture.nativeElement.querySelector('[aria-label="Reaktion hinzufügen"]')).toBeTruthy();
    });

    it('hides the "add reaction" trigger when there are no reactions', () => {
      setup({ isMobile: false, reaction: [], unique: [] });

      expect(fixture.nativeElement.querySelector('[aria-label="Reaktion hinzufügen"]')).toBeFalsy();
    });

    it('clicking the trigger opens the quick picker populated with the preselected emoji list', () => {
      setup({ isMobile: false });
      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Reaktion hinzufügen"]');
      trigger.click();
      fixture.detectChanges();

      expect(component.reactionMenuOpen()).toBeTrue();
      const picker = fixture.nativeElement.querySelector('app-emoji-quick-picker');
      expect(picker).toBeTruthy();
      const pickerButtons = picker.querySelectorAll('button');
      expect(pickerButtons.length).toBe(Object.values(PRESELECTED_EMOJIS).length);
    });

    it('clicking an emoji inside the quick picker toggles the reaction and closes the menu', () => {
      const message = setup({ isMobile: false });
      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Reaktion hinzufügen"]');
      trigger.click();
      fixture.detectChanges();

      const pickerButtons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('app-emoji-quick-picker button');
      pickerButtons[0].click();
      fixture.detectChanges();

      expect(reactionsServiceSpy.toggleReaction).toHaveBeenCalledOnceWith(message, Object.values(PRESELECTED_EMOJIS)[0], {
        channelId: 'channel-1',
        parentMessageId: 'parent-1',
        isThread: true,
      });
      expect(component.reactionMenuOpen()).toBeFalse();
    });

    it('the quick picker highlights emojis the user already reacted with, via reactionsService.hasReacted', () => {
      const reactedEmoji = Object.values(PRESELECTED_EMOJIS)[0];
      setup({ isMobile: false });
      reactionsServiceSpy.hasReacted.and.callFake((emoji: string) => emoji === reactedEmoji);
      fixture.detectChanges();

      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Reaktion hinzufügen"]');
      trigger.click();
      fixture.detectChanges();

      const pickerButtons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('app-emoji-quick-picker button');
      expect(pickerButtons[0].getAttribute('aria-pressed')).toBe('true');
      expect(pickerButtons[1].getAttribute('aria-pressed')).toBe('false');
    });

    it('Escape closes the quick-picker popup (FocusTrapPanelDirective panelClose)', () => {
      setup({ isMobile: false });
      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Reaktion hinzufügen"]');
      trigger.click();
      fixture.detectChanges();
      expect(component.reactionMenuOpen()).toBeTrue();

      const popup: HTMLElement = fixture.nativeElement.querySelector('.reaction-menu');
      popup.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
      fixture.detectChanges();

      expect(component.reactionMenuOpen()).toBeFalse();
      expect(fixture.nativeElement.querySelector('.reaction-menu')).toBeFalsy();
    });

    it('a click outside the trigger/popup closes the menu', () => {
      setup({ isMobile: false });
      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Reaktion hinzufügen"]');
      trigger.click();
      fixture.detectChanges();
      expect(component.reactionMenuOpen()).toBeTrue();

      const outside = document.createElement('div');
      document.body.appendChild(outside);
      outside.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();

      expect(component.reactionMenuOpen()).toBeFalse();
      outside.remove();
    });

    it('mouseleave on the container closes the menu', () => {
      setup({ isMobile: false });
      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Reaktion hinzufügen"]');
      trigger.click();
      fixture.detectChanges();
      expect(component.reactionMenuOpen()).toBeTrue();

      fixture.nativeElement.querySelector('.emoji-container').dispatchEvent(new MouseEvent('mouseleave', { bubbles: true }));
      fixture.detectChanges();

      expect(component.reactionMenuOpen()).toBeFalse();
    });
  });
});
