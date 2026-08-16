import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeaderSearchComponent } from './header-search.component';
import { SearchService } from '../../services/search/search.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { MentionService } from '../../services/mention/mention.service';
import { mockSignal } from '../../../../testing/signal-service-mock.util';
import { makeUser } from '../../../../testing/user-fixtures';

describe('HeaderSearchComponent', () => {
  let fixture: ComponentFixture<HeaderSearchComponent>;
  let component: HeaderSearchComponent;
  let searchServiceSpy: jasmine.SpyObj<any> & { isChannel: ReturnType<typeof mockSignal<boolean | null>> };

  beforeEach(async () => {
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

    await TestBed.configureTestingModule({
      imports: [HeaderSearchComponent],
      providers: [
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: NavigationService, useValue: jasmine.createSpyObj('NavigationService', ['selectDirectMessageRecipient', 'selectChannel']) },
        { provide: MentionService, useValue: jasmine.createSpyObj('MentionService', ['resolveTagName']) },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderSearchComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('dropdown visibility', () => {
    it('does not render app-search-result while the header list is closed', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-search-result')).toBeFalsy();
    });

    it('renders app-search-result once the header list is open', () => {
      searchServiceSpy.getHeaderListBoolean.and.returnValue(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-search-result')).toBeTruthy();
    });
  });

  describe('input wiring', () => {
    it('forwards typed input to searchService.observeInput with the "header" context', () => {
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      input.value = 'marc';
      // (input) is bound on the <app-input> host, not the nested native
      // <input>, so the event must actually bubble to reach it.
      input.dispatchEvent(new Event('input', { bubbles: true }));
      fixture.detectChanges();

      expect(searchServiceSpy.observeInput).toHaveBeenCalledWith('marc', 'header');
    });

    it('closes the list when the input is clicked', () => {
      fixture.detectChanges();
      const input: HTMLInputElement = fixture.nativeElement.querySelector('input');
      input.click();
      fixture.detectChanges();

      expect(searchServiceSpy.closeList).toHaveBeenCalled();
    });
  });

  describe('onSearchKeydown', () => {
    it('does nothing when the header list is closed', () => {
      searchServiceSpy.getHeaderListBoolean.and.returnValue(false);
      fixture.detectChanges();

      (component as any).onSearchKeydown(new KeyboardEvent('keydown', { key: 'ArrowDown' }));

      expect(searchServiceSpy.handleDropdownKeydown).not.toHaveBeenCalled();
    });

    it('delegates to searchService.handleDropdownKeydown when the header list is open', () => {
      searchServiceSpy.getHeaderListBoolean.and.returnValue(true);
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'ArrowDown' });
      (component as any).onSearchKeydown(event);

      expect(searchServiceSpy.handleDropdownKeydown).toHaveBeenCalledWith(event, jasmine.any(Function));
    });

    it('the Enter callback delegates to the search-result child\'s selectHighlighted()', () => {
      searchServiceSpy.getHeaderListBoolean.and.returnValue(true);
      searchServiceSpy.getCurrentList.and.returnValue([makeUser()]);
      searchServiceSpy.getHighlightedIndex.and.returnValue(0);
      searchServiceSpy.getHighlightedElement.and.returnValue(makeUser());
      fixture.detectChanges();

      const event = new KeyboardEvent('keydown', { key: 'Enter' });
      (component as any).onSearchKeydown(event);

      const onEnter = searchServiceSpy.handleDropdownKeydown.calls.mostRecent().args[1];
      expect(() => onEnter()).not.toThrow();
    });
  });

  describe('activeDescendantId', () => {
    it('returns null while the header list is closed', () => {
      searchServiceSpy.getHeaderListBoolean.and.returnValue(false);
      searchServiceSpy.getHighlightedIndex.and.returnValue(2);
      fixture.detectChanges();
      expect((component as any).activeDescendantId()).toBeNull();
    });

    it('returns null while nothing is highlighted (-1), even if the list is open', () => {
      searchServiceSpy.getHeaderListBoolean.and.returnValue(true);
      searchServiceSpy.getHighlightedIndex.and.returnValue(-1);
      fixture.detectChanges();
      expect((component as any).activeDescendantId()).toBeNull();
    });

    it('returns the computed option id while the list is open and an index is highlighted', () => {
      searchServiceSpy.getHeaderListBoolean.and.returnValue(true);
      searchServiceSpy.getHighlightedIndex.and.returnValue(2);
      fixture.detectChanges();
      expect((component as any).activeDescendantId()).toBe('header-search-listbox-option-2');
    });
  });
});
