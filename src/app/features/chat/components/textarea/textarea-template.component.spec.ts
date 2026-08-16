import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';

import { TextareaTemplateComponent } from './textarea-template.component';
import { SearchService } from '../../../../shared/services/search/search.service';
import { MentionService } from '../../../../shared/services/mention/mention.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

import { mockSignal } from '../../../../../testing/signal-service-mock.util';

describe('TextareaTemplateComponent', () => {
  let fixture: ComponentFixture<TextareaTemplateComponent>;
  let component: TextareaTemplateComponent;

  let searchServiceSpy: jasmine.SpyObj<any> & { isChannel: ReturnType<typeof mockSignal<boolean | null>> };
  let mentionServiceSpy: jasmine.SpyObj<MentionService>;

  beforeEach(async () => {
    searchServiceSpy = {
      isChannel: mockSignal<boolean | null>(null),
      getSearchComponent: jasmine.createSpy('getSearchComponent').and.returnValue('textarea'),
      getListBoolean: jasmine.createSpy('getListBoolean').and.returnValue(false),
      getHeaderListBoolean: jasmine.createSpy('getHeaderListBoolean').and.returnValue(false),
      getCurrentList: jasmine.createSpy('getCurrentList').and.returnValue([]),
      getHighlightedIndex: jasmine.createSpy('getHighlightedIndex').and.returnValue(-1),
      getHighlightedElement: jasmine.createSpy('getHighlightedElement').and.returnValue(undefined),
      getActiveTokenRange: jasmine.createSpy('getActiveTokenRange').and.returnValue(null),
      moveHighlightedIndex: jasmine.createSpy('moveHighlightedIndex'),
      handleDropdownKeydown: jasmine.createSpy('handleDropdownKeydown'),
      resetList: jasmine.createSpy('resetList'),
      closeList: jasmine.createSpy('closeList'),
      observeInput: jasmine.createSpy('observeInput'),
    };

    mentionServiceSpy = jasmine.createSpyObj<MentionService>('MentionService', ['insertTag', 'formatMentionMarkers', 'resolveTagName']);
    mentionServiceSpy.formatMentionMarkers.and.callFake((text: string) => text);

    await TestBed.configureTestingModule({
      imports: [TextareaTemplateComponent],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: MentionService, useValue: mentionServiceSpy },
        { provide: NavigationService, useValue: jasmine.createSpyObj('NavigationService', ['selectDirectMessageRecipient', 'selectChannel']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TextareaTemplateComponent);
    component = fixture.componentInstance;
  });

  function textarea(): HTMLTextAreaElement {
    return fixture.nativeElement.querySelector('textarea');
  }

  function sendBtn(): HTMLButtonElement {
    return fixture.nativeElement.querySelector('.btn-send button');
  }

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('send button disabled state', () => {
    it('is disabled when the input is empty', () => {
      fixture.detectChanges();
      expect(sendBtn().disabled).toBe(true);
    });

    it('is disabled when the input is whitespace-only', () => {
      component.input = '   ';
      fixture.detectChanges();
      expect(sendBtn().disabled).toBe(true);
    });

    it('is enabled once there is non-whitespace text', () => {
      component.input = 'hi';
      fixture.detectChanges();
      expect(sendBtn().disabled).toBe(false);
    });

    it('is disabled when the disabled() input is true, even with text', () => {
      component.input = 'hi';
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(sendBtn().disabled).toBe(true);
    });
  });

  describe('newMessage()', () => {
    it('emits the formatted text via (send) and clears the input', () => {
      component.input = 'hello there';
      fixture.detectChanges();
      const emitted: string[] = [];
      component.send.subscribe((v) => emitted.push(v));

      component.newMessage();

      expect(mentionServiceSpy.formatMentionMarkers).toHaveBeenCalledWith('hello there', []);
      expect(emitted).toEqual(['hello there']);
      expect(component.input).toBe('');
    });

    it('does not emit for empty/whitespace-only input', () => {
      component.input = '   ';
      fixture.detectChanges();
      const emitted: string[] = [];
      component.send.subscribe((v) => emitted.push(v));

      component.newMessage();

      expect(emitted).toEqual([]);
    });

    it('does not emit when disabled()=true even with text', () => {
      component.input = 'hello';
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      const emitted: string[] = [];
      component.send.subscribe((v) => emitted.push(v));

      component.newMessage();

      expect(emitted).toEqual([]);
    });

    it('the send button click calls newMessage()', () => {
      component.input = 'hi';
      fixture.detectChanges();
      const emitted: string[] = [];
      component.send.subscribe((v) => emitted.push(v));

      sendBtn().click();

      expect(emitted).toEqual(['hi']);
    });

    it('pressing Enter (no shift) while the suggestion list is closed sends the message', () => {
      component.input = 'hi';
      fixture.detectChanges();
      const emitted: string[] = [];
      component.send.subscribe((v) => emitted.push(v));

      const event = new KeyboardEvent('keydown', { key: 'Enter', shiftKey: false, cancelable: true });
      textarea().dispatchEvent(event);

      expect(emitted).toEqual(['hi']);
    });

    it('Shift+Enter does not send the message', () => {
      component.input = 'hi';
      fixture.detectChanges();
      const emitted: string[] = [];
      component.send.subscribe((v) => emitted.push(v));

      textarea().dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', shiftKey: true }));

      expect(emitted).toEqual([]);
    });

    it('delegates Enter to the dropdown handler while the suggestion list is open, instead of sending', () => {
      searchServiceSpy.getListBoolean.and.returnValue(true);
      component.input = 'hi';
      fixture.detectChanges();
      const emitted: string[] = [];
      component.send.subscribe((v) => emitted.push(v));

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      component.onKeydown(event);

      expect(searchServiceSpy.handleDropdownKeydown).toHaveBeenCalledWith(event, jasmine.any(Function));
      expect(emitted).toEqual([]);
    });
  });

  describe('insertTrigger', () => {
    it('inserts "@" at the caret when the dropdown is closed', fakeAsync(() => {
      component.input = 'ab';
      fixture.detectChanges();
      const ta = textarea();
      ta.value = 'ab';
      ta.selectionStart = 1;
      ta.selectionEnd = 1;

      component.insertTrigger('@', ta);
      tick();

      expect(component.input).toBe('a@b');
    }));

    it('inserts "#" at the caret when the dropdown is closed', fakeAsync(() => {
      component.input = 'xy';
      fixture.detectChanges();
      const ta = textarea();
      ta.value = 'xy';
      ta.selectionStart = 2;
      ta.selectionEnd = 2;

      component.insertTrigger('#', ta);
      tick();

      expect(component.input).toBe('xy#');
    }));

    it('closes the emoji picker when inserting a trigger', fakeAsync(() => {
      fixture.detectChanges();
      component.reactionMenuOpenInTextarea = true;
      const ta = textarea();

      component.insertTrigger('@', ta);
      tick();

      expect(component.reactionMenuOpenInTextarea).toBe(false);
    }));

    it('removes the active unconfirmed token and resets the list when re-triggering the same symbol while open', fakeAsync(() => {
      searchServiceSpy.getListBoolean.and.returnValue(true);
      searchServiceSpy.isChannel.set(false);
      searchServiceSpy.getActiveTokenRange.and.returnValue({ start: 0, end: 1 });
      component.input = '@';
      fixture.detectChanges();
      const ta = textarea();

      component.insertTrigger('@', ta);
      tick();

      expect(component.input).toBe('');
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    }));

    it('swaps the trigger symbol in place when switching from "@" to "#" while open', fakeAsync(() => {
      searchServiceSpy.getListBoolean.and.returnValue(true);
      searchServiceSpy.isChannel.set(false); // currently searching users (@)
      searchServiceSpy.getActiveTokenRange.and.returnValue({ start: 0, end: 1 });
      component.input = '@';
      fixture.detectChanges();
      const ta = textarea();
      ta.value = '@';

      component.insertTrigger('#', ta);
      tick();

      expect(component.input).toBe('#');
      expect(searchServiceSpy.resetList).not.toHaveBeenCalled();
    }));
  });

  describe('onTagInserted', () => {
    it('does nothing when there is no active token range', () => {
      searchServiceSpy.getActiveTokenRange.and.returnValue(null);
      fixture.detectChanges();
      const ta = textarea();

      component.onTagInserted('SomeUser', ta);

      expect(mentionServiceSpy.insertTag).not.toHaveBeenCalled();
    });

    it('splices the tag into the input via MentionService.insertTag and resets the list', fakeAsync(() => {
      searchServiceSpy.getActiveTokenRange.and.returnValue({ start: 0, end: 1 });
      searchServiceSpy.isChannel.set(false);
      mentionServiceSpy.insertTag.and.returnValue({ text: '@SomeUser ', caret: 10 });
      component.input = '@';
      fixture.detectChanges();
      const ta = textarea();

      component.onTagInserted('SomeUser', ta);
      tick();

      expect(mentionServiceSpy.insertTag).toHaveBeenCalledWith('@', 'SomeUser', '@', 0, 1);
      expect(component.input).toBe('@SomeUser ');
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    }));

    it('uses the "#" symbol when the active search is for channels', fakeAsync(() => {
      searchServiceSpy.getActiveTokenRange.and.returnValue({ start: 0, end: 1 });
      searchServiceSpy.isChannel.set(true);
      mentionServiceSpy.insertTag.and.returnValue({ text: '#general ', caret: 9 });
      component.input = '#';
      fixture.detectChanges();
      const ta = textarea();

      component.onTagInserted('general', ta);
      tick();

      expect(mentionServiceSpy.insertTag).toHaveBeenCalledWith('#', 'general', '#', 0, 1);
    }));
  });

  describe('emoji picker toggle', () => {
    it('is hidden when isChannelComponent() is false', () => {
      fixture.componentRef.setInput('isChannelComponent', false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('[aria-label="Emoji einfügen"]')).toBeFalsy();
    });

    it('renders and toggles when isChannelComponent() is true', () => {
      fixture.componentRef.setInput('isChannelComponent', true);
      fixture.detectChanges();
      const emojiBtn: HTMLButtonElement = fixture.nativeElement.querySelector('[aria-label="Emoji einfügen"]');
      expect(emojiBtn).toBeTruthy();

      emojiBtn.click();
      expect(component.reactionMenuOpenInTextarea).toBe(true);

      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.reaction-menu')).toBeTruthy();
    });

    it('addEmoji() appends the emoji to the input', () => {
      component.input = 'hi ';
      component.addEmoji('😀');
      expect(component.input).toBe('hi 😀');
    });

    it('closes an open mention dropdown when the emoji picker is opened', () => {
      searchServiceSpy.getListBoolean.and.returnValue(true);
      searchServiceSpy.getActiveTokenRange.and.returnValue({ start: 0, end: 1 });
      component.input = '@';
      fixture.componentRef.setInput('isChannelComponent', true);
      fixture.detectChanges();

      component.toggleEmojiPicker();

      expect(component.input).toBe('');
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    });
  });

  describe('search-result wiring', () => {
    it('does not render the suggestion dropdown while the list is closed', () => {
      searchServiceSpy.getListBoolean.and.returnValue(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-search-result')).toBeFalsy();
    });

    it('renders the suggestion dropdown while the list is open', () => {
      searchServiceSpy.getListBoolean.and.returnValue(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-search-result')).toBeTruthy();
    });
  });

  describe('focus()', () => {
    it('focuses the underlying textarea', () => {
      fixture.detectChanges();
      spyOn(textarea(), 'focus');
      component.focus();
      expect(textarea().focus).toHaveBeenCalled();
    });
  });
});
