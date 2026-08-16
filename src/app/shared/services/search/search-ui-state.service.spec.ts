import { TestBed } from '@angular/core/testing';
import { SearchUiStateService } from './search-ui-state.service';
import { makeUser } from '../../../../testing/user-fixtures';
import { makeChannel } from '../../../../testing/channel-fixtures';

describe('SearchUiStateService', () => {
  let service: SearchUiStateService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SearchUiStateService);
  });

  it('has expected initial state', () => {
    expect(service.getSearchComponent()).toBeNull();
    expect(service.getListBoolean()).toBeFalse();
    expect(service.getHeaderListBoolean()).toBeFalse();
    expect(service.getNewListBoolean()).toBeFalse();
    expect(service.getCurrentList()).toEqual([]);
    expect(service.getHighlightedIndex()).toBe(0);
    expect(service.isChannel()).toBeFalse();
    expect(service.searchQuery).toBe('');
    expect(service.activeTokenStart).toBeNull();
    expect(service.activeTokenEnd).toBeNull();
  });

  describe('searchInComponent get/set', () => {
    it('sets and gets "header"', () => {
      service.setSearchComponent('header');
      expect(service.getSearchComponent()).toBe('header');
    });

    it('sets and gets "textarea"', () => {
      service.setSearchComponent('textarea');
      expect(service.getSearchComponent()).toBe('textarea');
    });

    it('sets and gets "newMessage"', () => {
      service.setSearchComponent('newMessage');
      expect(service.getSearchComponent()).toBe('newMessage');
    });
  });

  describe('textareaListOpen get/set', () => {
    it('defaults to false and can be toggled', () => {
      expect(service.getListBoolean()).toBeFalse();
      service.setTextareaListOpen(true);
      expect(service.getListBoolean()).toBeTrue();
      service.setTextareaListOpen(false);
      expect(service.getListBoolean()).toBeFalse();
    });
  });

  describe('headerListOpen get/set', () => {
    it('defaults to false and can be toggled', () => {
      expect(service.getHeaderListBoolean()).toBeFalse();
      service.setHeaderListOpen(true);
      expect(service.getHeaderListBoolean()).toBeTrue();
      service.setHeaderListOpen(false);
      expect(service.getHeaderListBoolean()).toBeFalse();
    });
  });

  describe('newMessageListOpen get/set', () => {
    it('defaults to false and can be toggled', () => {
      expect(service.getNewListBoolean()).toBeFalse();
      service.setNewMessageListOpen(true);
      expect(service.getNewListBoolean()).toBeTrue();
      service.setNewMessageListOpen(false);
      expect(service.getNewListBoolean()).toBeFalse();
    });
  });

  describe('currentList get/set', () => {
    it('sets the current list and resets highlightedIndex to 0', () => {
      service.moveHighlightedIndex(0); // no-op since list is empty
      const list = [makeUser({ id: 'u1' }), makeUser({ id: 'u2' })];
      service.setCurrentList(list);
      expect(service.getCurrentList()).toEqual(list);
      expect(service.getHighlightedIndex()).toBe(0);
    });

    it('resets highlightedIndex to 0 even if it had moved before setCurrentList is called again', () => {
      service.setCurrentList([makeUser({ id: 'u1' }), makeUser({ id: 'u2' }), makeUser({ id: 'u3' })]);
      service.moveHighlightedIndex(2);
      expect(service.getHighlightedIndex()).toBe(2);

      service.setCurrentList([makeChannel({ id: 'c1' })]);
      expect(service.getHighlightedIndex()).toBe(0);
    });
  });

  describe('moveHighlightedIndex()', () => {
    it('does nothing when the current list is empty', () => {
      service.moveHighlightedIndex(1);
      expect(service.getHighlightedIndex()).toBe(0);
    });

    it('moves forward within bounds', () => {
      service.setCurrentList([makeUser({ id: 'u1' }), makeUser({ id: 'u2' }), makeUser({ id: 'u3' })]);
      service.moveHighlightedIndex(1);
      expect(service.getHighlightedIndex()).toBe(1);
      service.moveHighlightedIndex(1);
      expect(service.getHighlightedIndex()).toBe(2);
    });

    it('clamps at the upper bound (list.length - 1)', () => {
      service.setCurrentList([makeUser({ id: 'u1' }), makeUser({ id: 'u2' })]);
      service.moveHighlightedIndex(10);
      expect(service.getHighlightedIndex()).toBe(1);
    });

    it('clamps at the lower bound (0)', () => {
      service.setCurrentList([makeUser({ id: 'u1' }), makeUser({ id: 'u2' })]);
      service.moveHighlightedIndex(1);
      service.moveHighlightedIndex(-10);
      expect(service.getHighlightedIndex()).toBe(0);
    });

    it('moves backward within bounds', () => {
      service.setCurrentList([makeUser({ id: 'u1' }), makeUser({ id: 'u2' }), makeUser({ id: 'u3' })]);
      service.moveHighlightedIndex(2);
      service.moveHighlightedIndex(-1);
      expect(service.getHighlightedIndex()).toBe(1);
    });
  });

  describe('activeTokenStart/End', () => {
    it('setActiveTokenRange sets both start and end', () => {
      service.setActiveTokenRange(2, 5);
      expect(service.activeTokenStart).toBe(2);
      expect(service.activeTokenEnd).toBe(5);
    });

    it('clearActiveTokenRange resets both to null', () => {
      service.setActiveTokenRange(2, 5);
      service.clearActiveTokenRange();
      expect(service.activeTokenStart).toBeNull();
      expect(service.activeTokenEnd).toBeNull();
    });
  });

  describe('closeList()', () => {
    it('closes the header list when searchInComponent is "header"', () => {
      service.setSearchComponent('header');
      service.setHeaderListOpen(true);
      service.setTextareaListOpen(true);

      service.closeList();

      expect(service.getHeaderListBoolean()).toBeFalse();
      expect(service.getListBoolean()).toBeTrue();
    });

    it('closes the textarea list when searchInComponent is not "header" (e.g. "textarea")', () => {
      service.setSearchComponent('textarea');
      service.setHeaderListOpen(true);
      service.setTextareaListOpen(true);

      service.closeList();

      expect(service.getListBoolean()).toBeFalse();
      expect(service.getHeaderListBoolean()).toBeTrue();
    });

    it('closes the textarea list when searchInComponent is null (falls into the else branch)', () => {
      service.setTextareaListOpen(true);
      service.setHeaderListOpen(true);

      service.closeList();

      expect(service.getListBoolean()).toBeFalse();
      expect(service.getHeaderListBoolean()).toBeTrue();
    });
  });

  describe('resetList()', () => {
    it('resets currentList, isChannel, all list-open flags, highlightedIndex and token range', () => {
      service.setCurrentList([makeUser({ id: 'u1' }), makeUser({ id: 'u2' })]);
      service.moveHighlightedIndex(1);
      service.isChannel.set(true);
      service.setTextareaListOpen(true);
      service.setHeaderListOpen(true);
      service.setNewMessageListOpen(true);
      service.setActiveTokenRange(1, 3);

      service.resetList();

      expect(service.getCurrentList()).toEqual([]);
      expect(service.isChannel()).toBeFalse();
      expect(service.getListBoolean()).toBeFalse();
      expect(service.getHeaderListBoolean()).toBeFalse();
      expect(service.getNewListBoolean()).toBeFalse();
      expect(service.getHighlightedIndex()).toBe(0);
      expect(service.activeTokenStart).toBeNull();
      expect(service.activeTokenEnd).toBeNull();
    });
  });

  describe('searchQuery', () => {
    it('is a plain public property that can be read and written directly', () => {
      service.searchQuery = 'hello';
      expect(service.searchQuery).toBe('hello');
    });
  });
});
