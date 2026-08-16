import { TestBed } from '@angular/core/testing';
import { SearchService } from './search.service';
import { SearchUiStateService } from './search-ui-state.service';
import { SearchQueryService } from './search-query.service';
import { mockSignal } from '../../../../testing/signal-service-mock.util';
import { makeUser } from '../../../../testing/user-fixtures';
import { makeChannel } from '../../../../testing/channel-fixtures';

describe('SearchService', () => {
  let service: SearchService;
  let uiState: any;
  let queryServiceSpy: jasmine.SpyObj<SearchQueryService>;

  beforeEach(() => {
    uiState = {
      isChannel: mockSignal<boolean | null>(false),
      searchQuery: '',
      activeTokenStart: null as number | null,
      activeTokenEnd: null as number | null,
      getSearchComponent: jasmine.createSpy('getSearchComponent').and.callFake(() => uiState._searchComponent ?? null),
      setSearchComponent: jasmine.createSpy('setSearchComponent').and.callFake((component: string) => {
        uiState._searchComponent = component;
      }),
      getListBoolean: jasmine.createSpy('getListBoolean').and.returnValue(false),
      getHeaderListBoolean: jasmine.createSpy('getHeaderListBoolean').and.returnValue(false),
      getNewListBoolean: jasmine.createSpy('getNewListBoolean').and.returnValue(false),
      getCurrentList: jasmine.createSpy('getCurrentList').and.returnValue([]),
      setCurrentList: jasmine.createSpy('setCurrentList'),
      closeList: jasmine.createSpy('closeList'),
      getHighlightedIndex: jasmine.createSpy('getHighlightedIndex').and.returnValue(0),
      moveHighlightedIndex: jasmine.createSpy('moveHighlightedIndex'),
      setHeaderListOpen: jasmine.createSpy('setHeaderListOpen'),
      setTextareaListOpen: jasmine.createSpy('setTextareaListOpen'),
      setNewMessageListOpen: jasmine.createSpy('setNewMessageListOpen'),
      setActiveTokenRange: jasmine.createSpy('setActiveTokenRange').and.callFake((start: number, end: number) => {
        uiState.activeTokenStart = start;
        uiState.activeTokenEnd = end;
      }),
      resetList: jasmine.createSpy('resetList'),
    };

    queryServiceSpy = jasmine.createSpyObj<SearchQueryService>('SearchQueryService', ['startSearch']);

    TestBed.configureTestingModule({
      providers: [
        { provide: SearchUiStateService, useValue: uiState },
        { provide: SearchQueryService, useValue: queryServiceSpy },
      ],
    });
    service = TestBed.inject(SearchService);
  });

  describe('simple delegations', () => {
    it('isChannel getter returns uiState.isChannel', () => {
      expect(service.isChannel).toBe(uiState.isChannel);
    });

    it('searchQuery getter reads uiState.searchQuery', () => {
      uiState.searchQuery = 'hi';
      expect(service.searchQuery).toBe('hi');
    });

    it('searchQuery setter writes uiState.searchQuery', () => {
      service.searchQuery = 'hello';
      expect(uiState.searchQuery).toBe('hello');
    });

    it('getSearchComponent delegates to uiState', () => {
      uiState.getSearchComponent.and.returnValue('header');
      expect(service.getSearchComponent()).toBe('header');
    });

    it('getListBoolean delegates to uiState', () => {
      uiState.getListBoolean.and.returnValue(true);
      expect(service.getListBoolean()).toBeTrue();
    });

    it('getHeaderListBoolean delegates to uiState', () => {
      uiState.getHeaderListBoolean.and.returnValue(true);
      expect(service.getHeaderListBoolean()).toBeTrue();
    });

    it('getNewListBoolean delegates to uiState', () => {
      uiState.getNewListBoolean.and.returnValue(true);
      expect(service.getNewListBoolean()).toBeTrue();
    });

    it('getCurrentList delegates to uiState', () => {
      const list = [makeUser()];
      uiState.getCurrentList.and.returnValue(list);
      expect(service.getCurrentList()).toBe(list);
    });

    it('closeList delegates to uiState', () => {
      service.closeList();
      expect(uiState.closeList).toHaveBeenCalled();
    });

    it('getHighlightedIndex delegates to uiState', () => {
      uiState.getHighlightedIndex.and.returnValue(2);
      expect(service.getHighlightedIndex()).toBe(2);
    });

    it('moveHighlightedIndex delegates to uiState with delta', () => {
      service.moveHighlightedIndex(-1);
      expect(uiState.moveHighlightedIndex).toHaveBeenCalledWith(-1);
    });

    it('resetList delegates to uiState', () => {
      service.resetList();
      expect(uiState.resetList).toHaveBeenCalled();
    });
  });

  describe('getHighlightedElement()', () => {
    it('returns the entry at getHighlightedIndex() within getCurrentList()', () => {
      const alice = makeUser();
      const bob = makeUser();
      uiState.getCurrentList.and.returnValue([alice, bob]);
      uiState.getHighlightedIndex.and.returnValue(1);

      expect(service.getHighlightedElement()).toBe(bob);
    });

    it('returns undefined when the list is empty', () => {
      uiState.getCurrentList.and.returnValue([]);
      uiState.getHighlightedIndex.and.returnValue(0);

      expect(service.getHighlightedElement()).toBeUndefined();
    });
  });

  describe('getActiveTokenRange()', () => {
    it('returns null when activeTokenStart is null', () => {
      uiState.activeTokenStart = null;
      uiState.activeTokenEnd = 5;
      expect(service.getActiveTokenRange()).toBeNull();
    });

    it('returns null when activeTokenEnd is null', () => {
      uiState.activeTokenStart = 2;
      uiState.activeTokenEnd = null;
      expect(service.getActiveTokenRange()).toBeNull();
    });

    it('returns {start, end} when both are set', () => {
      uiState.activeTokenStart = 2;
      uiState.activeTokenEnd = 5;
      expect(service.getActiveTokenRange()).toEqual({ start: 2, end: 5 });
    });

    it('treats 0 as a valid (non-null) start', () => {
      uiState.activeTokenStart = 0;
      uiState.activeTokenEnd = 3;
      expect(service.getActiveTokenRange()).toEqual({ start: 0, end: 3 });
    });
  });

  describe('observeInput()', () => {
    it('always closes the header and textarea lists first, sets searchQuery and the component', () => {
      service.observeInput('  ', 'header');

      expect(uiState.setHeaderListOpen).toHaveBeenCalledWith(false);
      expect(uiState.setTextareaListOpen).toHaveBeenCalledWith(false);
      expect(uiState.searchQuery).toBe('  ');
      expect(uiState.setSearchComponent).toHaveBeenCalledWith('header');
    });

    it('resets the list and stops for a blank (whitespace-only) input', () => {
      service.observeInput('   ', 'textarea');

      expect(uiState.resetList).toHaveBeenCalled();
      expect(queryServiceSpy.startSearch).not.toHaveBeenCalled();
    });

    describe('no active @/# token', () => {
      it('in "header" with non-empty input: runs the tagless search across users and channels', () => {
        const alice = makeUser();
        const general = makeChannel();
        queryServiceSpy.startSearch.and.callFake((_input: string, collection?: 'channel' | 'user') =>
          collection === 'user' ? [alice] : [general],
        );

        service.observeInput('hello', 'header');

        expect(queryServiceSpy.startSearch).toHaveBeenCalledWith('hello', 'user');
        expect(queryServiceSpy.startSearch).toHaveBeenCalledWith('hello', 'channel');
        expect(uiState.setCurrentList).toHaveBeenCalledWith([alice, general]);
        expect(uiState.setTextareaListOpen).toHaveBeenCalledWith(false);
        expect(uiState.setHeaderListOpen).toHaveBeenCalledWith(true);
        expect(uiState.setNewMessageListOpen).toHaveBeenCalledWith(false);
        expect(uiState.isChannel()).toBeNull();
      });

      it('in "newMessage" with non-empty input: opens the new-message list instead of the header list', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('hello', 'newMessage');

        expect(uiState.setHeaderListOpen).toHaveBeenCalledWith(false);
        expect(uiState.setNewMessageListOpen).toHaveBeenCalledWith(true);
      });

      it('in "textarea": is not a "no-tag search", so it resets the list instead', () => {
        service.observeInput('hello', 'textarea');

        expect(uiState.resetList).toHaveBeenCalled();
        expect(queryServiceSpy.startSearch).not.toHaveBeenCalled();
      });
    });

    describe('active @/# token', () => {
      it('detects an "@" token at the end of the input and searches users', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('hello @wo', 'textarea');

        expect(uiState.isChannel()).toBeFalse();
        expect(uiState.setActiveTokenRange).toHaveBeenCalledWith(6, 9);
        expect(queryServiceSpy.startSearch).toHaveBeenCalledWith('wo', 'user');
        expect(uiState.setTextareaListOpen).toHaveBeenCalledWith(true);
        expect(uiState.setHeaderListOpen).toHaveBeenCalledWith(false);
        expect(uiState.setNewMessageListOpen).toHaveBeenCalledWith(false);
      });

      it('detects a "#" token and searches channels', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('hello #ge', 'textarea');

        expect(uiState.isChannel()).toBeTrue();
        expect(queryServiceSpy.startSearch).toHaveBeenCalledWith('ge', 'channel');
      });

      it('recognizes the token at the very start of the input', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('@wo', 'textarea');

        expect(uiState.setActiveTokenRange).toHaveBeenCalledWith(0, 3);
        expect(queryServiceSpy.startSearch).toHaveBeenCalledWith('wo', 'user');
      });

      it('recognizes an empty token (just typed the symbol)', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('@', 'textarea');

        expect(uiState.setActiveTokenRange).toHaveBeenCalledWith(0, 1);
        expect(queryServiceSpy.startSearch).toHaveBeenCalledWith('', 'user');
      });

      it('honors an explicit cursorPos in the middle of the string', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('hello @wo world', 'textarea', 9);

        expect(uiState.setActiveTokenRange).toHaveBeenCalledWith(6, 9);
        expect(queryServiceSpy.startSearch).toHaveBeenCalledWith('wo', 'user');
      });

      it('opens the header list when the component is "header" and a token is active', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('@wo', 'header');

        expect(uiState.setHeaderListOpen).toHaveBeenCalledWith(true);
        expect(uiState.setTextareaListOpen).toHaveBeenCalledWith(false);
        expect(uiState.setNewMessageListOpen).toHaveBeenCalledWith(false);
      });

      it('opens the new-message list when the component is "newMessage" and a token is active', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('@wo', 'newMessage');

        expect(uiState.setNewMessageListOpen).toHaveBeenCalledWith(true);
      });

      it('finds no token when the "@" is preceded by a non-whitespace character', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('email@domain', 'textarea');

        expect(uiState.resetList).toHaveBeenCalled();
        expect(queryServiceSpy.startSearch).not.toHaveBeenCalled();
      });

      it('finds no token once the caret has left it (trailing space after the token)', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('@foo ', 'textarea');

        expect(uiState.resetList).toHaveBeenCalled();
        expect(queryServiceSpy.startSearch).not.toHaveBeenCalled();
      });

      it('picks the last of several tokens preceding the cursor', () => {
        queryServiceSpy.startSearch.and.returnValue([]);

        service.observeInput('hi @a @b', 'textarea');

        expect(uiState.setActiveTokenRange).toHaveBeenCalledWith(6, 8);
        expect(queryServiceSpy.startSearch).toHaveBeenCalledWith('b', 'user');
      });
    });
  });

  describe('handleDropdownKeydown()', () => {
    function makeKeyEvent(key: string): KeyboardEvent {
      return new KeyboardEvent('keydown', { key });
    }

    it('ArrowDown: prevents default and moves highlight forward', () => {
      const event = makeKeyEvent('ArrowDown');
      spyOn(event, 'preventDefault');
      const onEnter = jasmine.createSpy('onEnter');

      service.handleDropdownKeydown(event, onEnter);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(uiState.moveHighlightedIndex).toHaveBeenCalledWith(1);
      expect(onEnter).not.toHaveBeenCalled();
    });

    it('ArrowUp: prevents default and moves highlight backward', () => {
      const event = makeKeyEvent('ArrowUp');
      spyOn(event, 'preventDefault');
      const onEnter = jasmine.createSpy('onEnter');

      service.handleDropdownKeydown(event, onEnter);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(uiState.moveHighlightedIndex).toHaveBeenCalledWith(-1);
    });

    it('Enter: prevents default and calls the caller-supplied onEnter', () => {
      const event = makeKeyEvent('Enter');
      spyOn(event, 'preventDefault');
      const onEnter = jasmine.createSpy('onEnter');

      service.handleDropdownKeydown(event, onEnter);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(onEnter).toHaveBeenCalled();
    });

    it('Escape: prevents default and resets the list', () => {
      const event = makeKeyEvent('Escape');
      spyOn(event, 'preventDefault');
      const onEnter = jasmine.createSpy('onEnter');

      service.handleDropdownKeydown(event, onEnter);

      expect(event.preventDefault).toHaveBeenCalled();
      expect(uiState.resetList).toHaveBeenCalled();
      expect(onEnter).not.toHaveBeenCalled();
    });

    it('any other key: does nothing', () => {
      const event = makeKeyEvent('a');
      spyOn(event, 'preventDefault');
      const onEnter = jasmine.createSpy('onEnter');

      service.handleDropdownKeydown(event, onEnter);

      expect(event.preventDefault).not.toHaveBeenCalled();
      expect(uiState.moveHighlightedIndex).not.toHaveBeenCalled();
      expect(uiState.resetList).not.toHaveBeenCalled();
      expect(onEnter).not.toHaveBeenCalled();
    });
  });
});
