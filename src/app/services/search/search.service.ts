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
  private tagType: 'channel' | 'user' | null = null;

  private textareaListOpen: boolean = false;
  private headerListOpen: boolean = false;
  private isChannel: boolean | null = false;
  private isResultTrue: boolean = false;
  private currentList: string[] = [];
  private redirectToResult: boolean = false;
  private searchInComponent: 'header' | 'textarea' | null = null;

  private input: string = '';

  public getRedirectToResultBoolean() {
    return this.redirectToResult;
  }

  public getListBoolean(): boolean {
    return this.textareaListOpen;
  }

  public getHeaderListBoolean(): boolean {
    return this.headerListOpen;
  }

  public getChannelBoolean(): boolean | null {
    return this.isChannel;
  }

  public getCurrentList(): any[] {
    return this.currentList;
  }

  public closeList(): void {
    this.searchInComponent === 'header' ? (this.headerListOpen = false) : (this.textareaListOpen = false);
    // this.listOpen = false;
  }

  public stopObserveInput(): void {
    this.isResultTrue = true;
  }

  private isAnonymous(): boolean | undefined {
    return this.authService.currentUser?.isAnonymous;
  }

  private userId(): string | undefined {
    return this.authService.currentUser?.uid;
  }

  public observeInput(input: string, searchInComponent: 'textarea' | 'header'): void {
    this.input = input;
    this.searchInComponent = searchInComponent;
    this.getTagType(input);
    if (!input.trim()) this.closeList();
    else this.isNoTagSearch() ? this.searchWithoutTag() : this.searchWithTag();
  }

  private isNoTagSearch() {
    return this.searchInComponent === 'header' && this.tagType == null && this.input.length > 0;
  }

  private searchWithoutTag() {
    let userResults = this.startSearch(this.input, 'user');
    let channelResults = this.startSearch(this.input, 'channel');
    this.currentList = [...userResults, ...channelResults];
    this.textareaListOpen = false;
    this.headerListOpen = true;
    this.isChannel = null;
    this.redirectToResult = true;
  }

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

  private caseChannel() {
    let searchInput: string | null = null;
    searchInput = this.input.split('#')[1];
    this.currentList = this.startSearch(searchInput, 'channel');
    this.isChannel = true;

    this.searchInComponent === 'textarea' ? (this.textareaListOpen = true) : (this.headerListOpen = true);
    if (!searchInput) this.tagType = null;
  }

  private caseUser() {
    let searchInput: string | null = null;
    searchInput = this.input.split('@')[1];
    this.currentList = this.startSearch(searchInput, 'user');
    this.isChannel = false;

    this.searchInComponent === 'textarea' ? (this.textareaListOpen = true) : (this.headerListOpen = true);
    if (!searchInput) this.tagType = null;
  }

  private resetList() {
    this.currentList = [];
    this.isChannel = false;
    this.textareaListOpen = false;
    this.headerListOpen = false;
  }

  private getTagType(input: string): void {
    if (input.includes('@')) this.tagType = 'user';
    if (input.includes('#')) this.tagType = 'channel';
  }

  private searchChannelMembersByName(searchInput: string, channelsToSearch: any): string[] {
    let foundMembers: any[] = [];
    channelsToSearch.forEach((channel: { data?: { member?: any[] } }) => {
      let members = channel.data?.member || [];
      let matchingMembers = members.filter((member: any) => member.fullname?.toLowerCase().includes(searchInput));

      foundMembers = [...foundMembers, ...matchingMembers];
    });

    return foundMembers;
  }

  private searchChannel(searchInput: string, channelsToSearch: any) {
    let foundChannels: any = [];
    foundChannels = channelsToSearch.filter((channel: { data?: { name?: string } }) =>
      channel.data?.name?.toLowerCase().includes(searchInput)
    );

    return foundChannels;
  }

  public startSearch(input?: string, searchCollection?: 'channel' | 'user'): string[] {
    let searchInput = input?.trim().toLowerCase() || '';
    let result: any[] = [];
    let channelsToSearch = this.isAnonymous()
      ? this.userService.channels.filter((channel: { key: string }) => channel.key === 'KqvcY68R1jP2UsQkv6Nz')
      : this.userService.channels.filter((channel: { data?: { member?: any[] } }) =>
          channel.data?.member?.some((member: any) => member.id === this.userId())
        );
    if (searchCollection === 'channel') {
      result = this.searchChannel(searchInput, channelsToSearch);
      // this.isResultTrue = true;
    } else if (searchCollection === 'user') {
      result = this.searchChannelMembersByName(searchInput, channelsToSearch);
      //  this.isResultTrue = true;
    }

    return result;
  }

  /**
   * Handles autocomplete logic for mentions and channels in the input.
   * @param type - Optional preset string to insert
   */
  public getList(type?: string): void {
    this.textareaListOpen = true;

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
