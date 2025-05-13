import { inject, Injectable } from '@angular/core';
import { UserService } from '../user/shared.service';
import { Auth } from '@angular/fire/auth';

@Injectable({
  providedIn: 'root',
})
export class SearchService {
  constructor() {}
  authService: Auth = inject(Auth);
  userService: UserService = inject(UserService);

  private get isAnonymous(): boolean {
    return this.authService.currentUser?.isAnonymous ?? true;
  }

  private get userId(): string | undefined {
    return this.authService.currentUser?.uid;
  }

  private searchChannelMembersByName(searchInput: string, channelsToSearch: any) {
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

  public startSearch(input: string, searchCollection: 'channel' | 'user') {
    let searchInput = input.trim().toLowerCase();
    let result: any[] = [];
    let channelsToSearch = this.isAnonymous
      ? this.userService.channels.filter((channel: { key: string }) => channel.key === 'KqvcY68R1jP2UsQkv6Nz')
      : this.userService.channels.filter((channel: { data?: { member?: any[] } }) =>
          channel.data?.member?.some((member: any) => member.id === this.userId)
        );
    if (searchCollection === 'channel') result = this.searchChannel(searchInput, channelsToSearch);
    else if (searchCollection === 'user') result = this.searchChannelMembersByName(searchInput, channelsToSearch);

    return result;
  }
}
