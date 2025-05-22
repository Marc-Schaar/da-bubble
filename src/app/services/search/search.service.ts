import { inject, Injectable } from '@angular/core';
import { UserService } from '../user/shared.service';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor() {}
  private authService: Auth = inject(Auth);
  private userService: UserService = inject(UserService);
  private textareaListOpen: boolean = false;
  private headerListOpen: boolean = false;
  private newMessageListOpen: boolean = false;
  private isChannel: boolean | null = false;
  private isResultTrue: boolean = false;
  private directTag: boolean = false;

  private currentList: string[] = [];
  private tagType: 'channel' | 'user' | null = null;
  private searchInComponent: 'header' | 'textarea' | 'newMessage' | null = null;
  private input: string = '';

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
   * Returns whether the current tagType is a channel.
   */
  public getChannelBoolean(): boolean | null {
    return this.isChannel;
  }

  /**
   * Sets the tagType to a channel.
   *
   * @param {boolean} isChannel - True if it should be marked as a channel, false otherwise.
   */
  public setChannelBoolean(boolean: boolean) {
    this.isChannel = boolean;
  }

  /**
   * Returns the current autocomplete result list.
   */
  public getCurrentList(): any[] {
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
   * Checks if the current user is anonymous.
   * @returns {boolean | undefined} True if anonymous, false if not, or undefined if no user is signed in.
   */
  private isAnonymous(): boolean | undefined {
    return this.authService.currentUser?.isAnonymous;
  }

  /**
   * Retrieves the UID of the current user.
   * @returns {string | undefined} The user ID, or undefined if no user is signed in.
   */
  private userId(): string | undefined {
    return this.authService.currentUser?.uid;
  }

  /**
   * Observes user input and determines whether to search for users or channels.
   * @param input - The input string entered by the user.
   * @param searchInComponent - The context where the input comes from: 'textarea' or 'header'.
   */
  public observeInput(input: string, searchInComponent: 'textarea' | 'header' | 'newMessage'): void {
    this.headerListOpen = false;
    this.textareaListOpen = false;
    this.input = input;
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
      (this.searchInComponent === 'header' || this.searchInComponent === 'newMessage') && this.tagType == null && this.input.length > 0
    );
  }

  /**
   * Handles search when no tag is used, searching for both users and channels.
   */
  private searchWithoutTag() {
    let userResults = this.startSearch(this.input, 'user');
    let channelResults = this.startSearch(this.input, 'channel');
    this.currentList = [...userResults, ...channelResults];
    this.textareaListOpen = false;
    this.searchInComponent === 'header' ? (this.headerListOpen = true) : (this.headerListOpen = false);
    this.searchInComponent === 'newMessage' ? (this.newMessageListOpen = true) : (this.newMessageListOpen = false);
    this.isChannel = null;
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
        this.resetList;
        break;
    }
  }

  /**
   * Handles channel tag search logic.
   */
  private caseChannel() {
    let searchInput: string | null = null;
    this.isChannel = true;
    searchInput = this.input.split('#')[1];
    this.currentList = this.startSearch(searchInput, 'channel');

    this.searchInComponent === 'textarea' ? (this.textareaListOpen = true) : (this.headerListOpen = true);
    if (!searchInput) this.tagType = null;
  }

  /**
   * Handles user tag search logic.
   */
  private caseUser() {
    let searchInput: string | null = null;
    this.isChannel = false;
    searchInput = this.input.split('@')[1];
    this.currentList = this.startSearch(searchInput, 'user');

    this.searchInComponent === 'textarea' ? (this.textareaListOpen = true) : (this.headerListOpen = true);
    if (!searchInput) this.tagType = null;
  }

  /**
   * Resets the current suggestion list and UI flags.
   */
  public resetList() {
    this.currentList = [];
    this.isChannel = false;
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
  private searchChannelMembersByName(searchInput: string, channelsToSearch: any): string[] {
    let foundMembers: any[] = [];
    channelsToSearch.forEach((channel: { data?: { member?: any[] } }) => {
      let members = channel.data?.member || [];
      let matchingMembers = members.filter((member: any) => member.fullname?.toLowerCase().includes(searchInput));

      foundMembers = [...foundMembers, ...matchingMembers];
    });
    return foundMembers;
  }

  /**
   * Searches channels by name.
   * @param searchInput - The lowercase input string to search for.
   * @param channelsToSearch - The list of channels to search within.
   * @returns {string[]} A list of matching channels.
   */
  private searchChannel(searchInput: string, channelsToSearch: any) {
    let foundChannels: any = [];
    foundChannels = channelsToSearch.filter((channel: { data?: { name?: string } }) =>
      channel.data?.name?.toLowerCase().includes(searchInput)
    );

    return foundChannels;
  }

  /**
   * Starts a search based on the given input and search type (channel or user).
   * @param input - The input string to search for.
   * @param searchCollection - The type of entity to search for ('channel' or 'user').
   * @returns {string[]} A list of matched results.
   */
  public startSearch(input: string, searchCollection?: 'channel' | 'user'): string[] {
    let searchInput = input.trim()?.toLowerCase() || '';
    let result: any[] = [];
    let channelsToSearch = this.isAnonymous()
      ? this.userService.channels.filter((channel: { key: string }) => channel.key === 'KqvcY68R1jP2UsQkv6Nz')
      : this.userService.channels.filter((channel: { data?: { member?: any[] } }) =>
          channel.data?.member?.some((member: any) => member.id === this.userId())
        );
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
      this.currentList = this.userService.channels.filter((channel: { data?: { member?: any[] } }) =>
        channel.data?.member?.some((member: any) => member.id === this.userId())
      );
      if (this.userService.currentUser.isAnonymous) {
        this.currentList = this.userService.channels.filter((channel: { key: string }) => channel.key === 'KqvcY68R1jP2UsQkv6Nz');
      }
      this.isChannel = true;
    } else if (type === '@') {
      this.currentList = this.userService.users;
      this.isChannel = false;
    }
  }
}
