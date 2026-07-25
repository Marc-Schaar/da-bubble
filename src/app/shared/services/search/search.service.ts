import { inject, Injectable } from '@angular/core';
import { FireServiceService } from '../firebase/fire-service.service';
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
  private fireService: FireServiceService = inject(FireServiceService);
  private uiState = inject(SearchUiStateService);
  private queryService = inject(SearchQueryService);

  private tagType: 'channel' | 'user' | null = null;

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
   * Returns whether this tag is a direct message tag.
   */
  public isDirectTag(): boolean {
    return this.uiState.isDirectTag();
  }

  /**
   * Sets whether this tag is a direct message tag.
   */
  public setIsDirectTag(isDirect: boolean) {
    this.uiState.setIsDirectTag(isDirect);
  }

  public setResult(stopped: boolean) {
    this.uiState.setResult(stopped);
  }

  /**
   * Closes the currently active suggestion list.
   */
  public closeList(): void {
    this.uiState.closeList();
  }

  /**
   * Stops observing input to prevent triggering further search actions.
   */
  public stopObserveInput(): void {
    this.setResult(true);
  }

  /**
   * Reset observing input to prevent triggering further search actions.
   */
  public resetObserveInput(): void {
    this.setResult(false);
  }

  /**
   * Observes user input and determines whether to search for users or channels.
   * @param input - The input string entered by the user.
   * @param searchInComponent - The context where the input comes from: 'textarea', 'header' or 'newMessage'.
   */
  public observeInput(input: string, searchInComponent: 'textarea' | 'header' | 'newMessage'): void {
    if (this.uiState.isResultStopped()) return;
    this.uiState.setHeaderListOpen(false);
    this.uiState.setTextareaListOpen(false);
    this.searchQuery = input;
    this.uiState.setSearchComponent(searchInComponent);

    this.getTagType(input);
    if (!input.trim()) this.closeList();
    if (this.uiState.isResultStopped()) {
      return;
    } else this.isNoTagSearch() ? this.searchWithoutTag() : this.searchWithTag();
  }

  /**
   * Determines if the current input is a tagless search in the header or new message.
   * @returns {boolean} True if it's a no-tag header search, otherwise false.
   */
  private isNoTagSearch() {
    return (
      (this.uiState.getSearchComponent() === 'header' || this.uiState.getSearchComponent() === 'newMessage') &&
      this.tagType == null &&
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
   * Handles search when a tag is detected (either '@' for users or '#' for channels).
   */
  private searchWithTag() {
    switch (this.tagType) {
      case 'channel':
        this.caseChannel();
        break;

      case 'user':
        this.caseUser();
        break;

      default:
        this.resetList();
        break;
    }
  }

  /**
   * Handles channel tag search logic.
   */
  private caseChannel() {
    let searchInput: string | null = null;
    this.uiState.isChannel.set(true);
    searchInput = this.searchQuery.split('#')[1];
    this.uiState.setCurrentList(this.queryService.startSearch(searchInput, 'channel'));

    this.uiState.getSearchComponent() === 'textarea' ? this.uiState.setTextareaListOpen(true) : this.uiState.setHeaderListOpen(true);
    if (!searchInput) this.tagType = null;
  }

  /**
   * Handles user tag search logic.
   */
  private caseUser() {
    let searchInput: string | null = null;
    this.uiState.isChannel.set(false);
    searchInput = this.searchQuery.split('@')[1];
    this.uiState.setCurrentList(this.queryService.startSearch(searchInput, 'user'));

    this.uiState.getSearchComponent() === 'textarea' ? this.uiState.setTextareaListOpen(true) : this.uiState.setHeaderListOpen(true);
    if (!searchInput) this.tagType = null;
  }

  /**
   * Resets the current suggestion list and UI flags.
   */
  public resetList() {
    this.uiState.resetList();
  }

  /**
   * Determines the tag type in the input string (user or channel).
   * @param input - The input string to analyze.
   */
  private getTagType(input: string): void {
    if (input.includes('@')) this.tagType = 'user';
    if (input.includes('#')) this.tagType = 'channel';
  }

  /**
   * Opens the appropriate autocomplete list based on the tag type ('@' or '#').
   * @param type - Optional preset string to determine the tag context.
   */
  public getList(type?: string): void {
    this.uiState.setTextareaListOpen(true);
    this.uiState.setHeaderListOpen(false);
    this.uiState.setSearchComponent('textarea');
    this.uiState.setIsDirectTag(true);
    if (type === '#') {
      this.uiState.setCurrentList(this.fireService.myChannels());
      this.uiState.isChannel.set(true);
    } else if (type === '@') {
      this.uiState.setCurrentList(this.fireService.allUsers());
      this.uiState.isChannel.set(false);
    }
  }
}
