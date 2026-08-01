import { inject, Injectable } from '@angular/core';
import { SearchQueryService } from './search-query.service';
import { SearchUiStateService } from './search-ui-state.service';

/**
 * Orchestriert Sucheingaben: liest/schreibt UI-Zustand über
 * `SearchUiStateService` und ermittelt Treffer über `SearchQueryService`.
 * Bleibt als einzige Fassade bestehen, die Komponenten injizieren.
 */
@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private uiState = inject(SearchUiStateService);
  private queryService = inject(SearchQueryService);

  public get isChannel() {
    return this.uiState.isChannel;
  }

  public get searchQuery(): string {
    return this.uiState.searchQuery;
  }

  public set searchQuery(value: string) {
    this.uiState.searchQuery = value;
  }

  /**
   * Returns the current Search Component.
   */
  public getSearchComponent() {
    return this.uiState.getSearchComponent();
  }

  /**
   * Returns whether the textarea suggestion list is open.
   */
  public getListBoolean(): boolean {
    return this.uiState.getListBoolean();
  }

  /**
   * Returns whether the header suggestion list is open.
   */
  public getHeaderListBoolean(): boolean {
    return this.uiState.getHeaderListBoolean();
  }

  /**
   * Returns whether the New Message Component suggestion list is open.
   */
  public getNewListBoolean(): boolean {
    return this.uiState.getNewListBoolean();
  }

  /**
   * Returns the current autocomplete result list.
   */
  public getCurrentList() {
    return this.uiState.getCurrentList();
  }

  /**
   * Closes the currently active suggestion list.
   */
  public closeList(): void {
    this.uiState.closeList();
  }

  /**
   * Returns the currently highlighted index in the suggestion dropdown.
   */
  public getHighlightedIndex(): number {
    return this.uiState.getHighlightedIndex();
  }

  /**
   * Moves the keyboard highlight in the suggestion dropdown by `delta`.
   */
  public moveHighlightedIndex(delta: number): void {
    this.uiState.moveHighlightedIndex(delta);
  }

  /**
   * Returns the currently highlighted suggestion, if any.
   */
  public getHighlightedElement() {
    return this.uiState.getCurrentList()[this.uiState.getHighlightedIndex()];
  }

  /**
   * Returns the start/end index of the `@`/`#` token currently being typed
   * in the textarea, or null if none is active.
   */
  public getActiveTokenRange(): { start: number; end: number } | null {
    const { activeTokenStart, activeTokenEnd } = this.uiState;
    if (activeTokenStart == null || activeTokenEnd == null) return null;
    return { start: activeTokenStart, end: activeTokenEnd };
  }

  /**
   * Observes user input and determines whether to search for users or channels.
   * @param input - The current full value of the input/textarea.
   * @param searchInComponent - The context where the input comes from: 'textarea', 'header' or 'newMessage'.
   * @param cursorPos - The caret position within `input`. Defaults to the end of the string,
   *   which reproduces the previous behaviour for single-line header/new-message inputs.
   */
  public observeInput(input: string, searchInComponent: 'textarea' | 'header' | 'newMessage', cursorPos: number = input.length): void {
    this.uiState.setHeaderListOpen(false);
    this.uiState.setTextareaListOpen(false);
    this.searchQuery = input;
    this.uiState.setSearchComponent(searchInComponent);

    if (!input.trim()) {
      this.resetList();
      return;
    }

    const token = this.extractActiveToken(input, cursorPos);
    if (!token) {
      this.isNoTagSearch() ? this.searchWithoutTag() : this.resetList();
      return;
    }
    this.searchWithTag(token);
  }

  /**
   * Finds the `@`/`#` token immediately before the caret: it must start either
   * at the beginning of the input or right after whitespace, and must not yet
   * contain whitespace itself. Returns null once the caret has left the token
   * (e.g. after a space was typed), so the caller can close the suggestion list.
   */
  private extractActiveToken(input: string, cursorPos: number): { symbol: '@' | '#'; query: string; start: number; end: number } | null {
    const uptoCursor = input.slice(0, cursorPos);
    const match = uptoCursor.match(/(?:^|\s)([@#])([^\s@#]*)$/);
    if (!match) return null;

    const symbol = match[1] as '@' | '#';
    const start = match.index! + (match[0].length - (match[1].length + match[2].length));
    return { symbol, query: match[2], start, end: cursorPos };
  }

  /**
   * Determines if the current input is a tagless search in the header or new message.
   * @returns {boolean} True if it's a no-tag header search, otherwise false.
   */
  private isNoTagSearch() {
    return (
      (this.uiState.getSearchComponent() === 'header' || this.uiState.getSearchComponent() === 'newMessage') &&
      this.searchQuery.length > 0
    );
  }

  /**
   * Handles search when no tag is used, searching for both users and channels.
   */
  private searchWithoutTag() {
    let userResults = this.queryService.startSearch(this.searchQuery, 'user');
    let channelResults = this.queryService.startSearch(this.searchQuery, 'channel');
    this.uiState.setCurrentList([...userResults, ...channelResults]);
    this.uiState.setTextareaListOpen(false);
    this.uiState.setHeaderListOpen(this.uiState.getSearchComponent() === 'header');
    this.uiState.setNewMessageListOpen(this.uiState.getSearchComponent() === 'newMessage');
    this.uiState.isChannel.set(null);
  }

  /**
   * Handles search once an `@`/`#` token was found near the caret.
   */
  private searchWithTag(token: { symbol: '@' | '#'; query: string; start: number; end: number }) {
    const isChannel = token.symbol === '#';
    this.uiState.isChannel.set(isChannel);
    this.uiState.setActiveTokenRange(token.start, token.end);
    this.uiState.setCurrentList(this.queryService.startSearch(token.query, isChannel ? 'channel' : 'user'));

    this.uiState.getSearchComponent() === 'textarea' ? this.uiState.setTextareaListOpen(true) : this.uiState.setHeaderListOpen(true);
  }

  /**
   * Resets the current suggestion list and UI flags.
   */
  public resetList() {
    this.uiState.resetList();
  }

  /**
   * Shared Arrow/Enter/Escape handling for any input paired with a
   * suggestion dropdown. `onEnter` is caller-supplied since what "select
   * the highlighted item" means differs (tag insertion vs. navigation vs.
   * setting a receiver) — callers typically pass the dropdown's own
   * `selectHighlighted()`. Only call this while the caller's own list is
   * open; it does not check that itself since it has no way to know which
   * of header/textarea/newMessage list applies to the caller.
   */
  public handleDropdownKeydown(event: KeyboardEvent, onEnter: () => void): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.moveHighlightedIndex(1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.moveHighlightedIndex(-1);
        break;
      case 'Enter':
        event.preventDefault();
        onEnter();
        break;
      case 'Escape':
        event.preventDefault();
        this.resetList();
        break;
    }
  }
}
