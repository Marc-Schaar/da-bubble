import { inject, Injectable, signal } from '@angular/core';
import { FireServiceService } from '../firebase/fire-service.service';
import { Channel } from '../../../features/channel/models/channel/channel';
import { User } from '../../../features/auth/models/user/user';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  private fireService: FireServiceService = inject(FireServiceService);

  private textareaListOpen: boolean = false;
  private headerListOpen: boolean = false;
  private newMessageListOpen: boolean = false;
  public isChannel = signal<boolean | null>(false);
  private isResultTrue: boolean = false;
  private directTag: boolean = false;

  private currentList: (User | Channel)[] = [];
  private tagType: 'channel' | 'user' | null = null;
  private searchInComponent: 'header' | 'textarea' | 'newMessage' | null = null;
  public searchQuery: string = '';

  /**
   * Returns the current Search Component.
   */
  public getSearchComponent() {
    return this.searchInComponent;
  }

  /**
   * Returns whether the textarea suggestion list is open.
   */
  public getListBoolean(): boolean {
    return this.textareaListOpen;
  }

  /**
   * Returns whether the header suggestion list is open.
   */
  public getHeaderListBoolean(): boolean {
    return this.headerListOpen;
  }

  /**
   * Returns whether the New Message Component suggestion list is open.
   */
  public getNewListBoolean(): boolean {
    return this.newMessageListOpen;
  }

  /**
   * Returns the current autocomplete result list.
   */
  public getCurrentList(): (User | Channel)[] {
    return this.currentList;
  }

  /**
   * Returns whether this tag is a direct message tag.
   *
   * @returns {boolean} True if it is a direct message tag, false otherwise.
   */
  public isDirectTag(): boolean {
    return this.directTag;
  }

  /**
   * Sets whether this tag is a direct message tag.
   *
   * @param {boolean} isDirect - True if it should be marked as a direct message tag, false otherwise.
   */
  public setIsDirectTag(boolean: boolean) {
    this.directTag = boolean;
  }

  /**
   * Returns whether the result is true.
   */
  public setResult(boolean: boolean) {
    this.isResultTrue = boolean;
  }

  /**
   * Closes the currently active suggestion list.
   */
  public closeList(): void {
    this.searchInComponent === 'header' ? (this.headerListOpen = false) : (this.textareaListOpen = false);
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
   * @param searchInComponent - The context where the input comes from: 'textarea' or 'header'.
   */
  public observeInput(input: string, searchInComponent: 'textarea' | 'header' | 'newMessage'): void {
    if (this.isResultTrue) return;
    this.headerListOpen = false;
    this.textareaListOpen = false;
    this.searchQuery = input;
    this.searchInComponent = searchInComponent;

    this.getTagType(input);
    if (!input.trim()) this.closeList();
    if (this.isResultTrue) {
      return;
    } else this.isNoTagSearch() ? this.searchWithoutTag() : this.searchWithTag();
  }

  /**
   * Determines if the current input is a tagless search in the header or new message.
   * @returns {boolean} True if it's a no-tag header search, otherwise false.
   */
  private isNoTagSearch() {
    return (
      (this.searchInComponent === 'header' || this.searchInComponent === 'newMessage') &&
      this.tagType == null &&
      this.searchQuery.length > 0
    );
  }

  /**
   * Handles search when no tag is used, searching for both users and channels.
   */
  private searchWithoutTag() {
    let userResults = this.startSearch(this.searchQuery, 'user');
    let channelResults = this.startSearch(this.searchQuery, 'channel');
    this.currentList = [...userResults, ...channelResults];
    this.textareaListOpen = false;
    this.searchInComponent === 'header' ? (this.headerListOpen = true) : (this.headerListOpen = false);
    this.searchInComponent === 'newMessage' ? (this.newMessageListOpen = true) : (this.newMessageListOpen = false);
    this.isChannel.set(null);
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
    this.isChannel.set(true);
    searchInput = this.searchQuery.split('#')[1];
    this.currentList = this.startSearch(searchInput, 'channel');

    this.searchInComponent === 'textarea' ? (this.textareaListOpen = true) : (this.headerListOpen = true);
    if (!searchInput) this.tagType = null;
  }

  /**
   * Handles user tag search logic.
   */
  private caseUser() {
    let searchInput: string | null = null;
    this.isChannel.set(false);
    searchInput = this.searchQuery.split('@')[1];
    this.currentList = this.startSearch(searchInput, 'user');

    this.searchInComponent === 'textarea' ? (this.textareaListOpen = true) : (this.headerListOpen = true);
    if (!searchInput) this.tagType = null;
  }

  /**
   * Resets the current suggestion list and UI flags.
   */
  public resetList() {
    this.currentList = [];
    this.isChannel.set(false);
    this.textareaListOpen = false;
    this.headerListOpen = false;
    this.newMessageListOpen = false;
    this.directTag = false;
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
   * Searches channel members by name.
   * @param searchInput - The lowercase input string to search for.
   * @param channelsToSearch - The list of channels to search within.
   * @returns {string[]} A list of matching members.
   */
  private searchChannelMembersByName(searchInput: string, channelsToSearch: Channel[]): User[] {
    const searchLower = searchInput.toLowerCase();
    const memberIdsInChannels = new Set<string>();

    channelsToSearch.forEach((channel) => {
      const members = channel?.member || [];
      members.forEach((member: { id: string }) => {
        const id = typeof member === 'string' ? member : member.id;
        if (id) memberIdsInChannels.add(id);
      });
    });
    this.fireService.subAllUsers();
    const allUsers: User[] = this.fireService.allUsers();

    return allUsers.filter((user) => memberIdsInChannels.has(user.id) && user.displayName?.toLowerCase().includes(searchLower));
  }

  /**
   * Searches channels by name.
   * @param searchInput - The lowercase input string to search for.
   * @param channelsToSearch - The list of channels to search within.
   * @returns {Channel[]} A list of matching channels.
   */
  private searchChannel(searchInput: string, channelsToSearch: Channel[]): Channel[] {
    return channelsToSearch.filter((channel: { name: string }) => channel.name.toLowerCase().includes(searchInput));
  }

  /**
   * Starts a search based on the given input and search type (channel or user).
   * @param input - The input string to search for.
   * @param searchCollection - The type of entity to search for ('channel' or 'user').
   * @returns {string[]} A list of matched results.
   */
  public startSearch(input: string, searchCollection?: 'channel' | 'user'): (Channel | User)[] {
    this.fireService.subChannels();
    let searchInput = input.trim()?.toLowerCase() || '';
    let result: (Channel | User)[] = [];
    const channelsToSearch = this.fireService.myChannels();

    if (searchCollection === 'channel') {
      result = this.searchChannel(searchInput, channelsToSearch);
    } else if (searchCollection === 'user') {
      result = this.searchChannelMembersByName(searchInput, channelsToSearch);
    }

    return result;
  }

  /**
   * Opens the appropriate autocomplete list based on the tag type ('@' or '#').
   * @param type - Optional preset string to determine the tag context.
   */
  public getList(type?: string): void {
    this.textareaListOpen = true;
    this.headerListOpen = false;
    this.searchInComponent = 'textarea';
    this.directTag = true;
    if (type === '#') {
      this.currentList = this.fireService.myChannels();
      this.isChannel.set(true);
    } else if (type === '@') {
      this.currentList = this.fireService.allUsers();
      this.isChannel.set(false);
    }
  }
}
