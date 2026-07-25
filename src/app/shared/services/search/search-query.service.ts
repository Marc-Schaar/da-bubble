import { inject, Injectable } from '@angular/core';
import { FireServiceService } from '../firebase/fire-service.service';
import { Channel } from '../../../features/channel/models/channel/channel';
import { User } from '../../../features/auth/models/user/user';

/**
 * Reine Suchlogik gegen die per FireService gestreamten Channels/User —
 * kennt keinen UI-Zustand (welche Liste offen ist, o.ä.).
 */
@Injectable({
  providedIn: 'root',
})
export class SearchQueryService {
  private fireService: FireServiceService = inject(FireServiceService);

  /**
   * Searches channel members by name.
   * @param searchInput - The lowercase input string to search for.
   * @param channelsToSearch - The list of channels to search within.
   * @returns {User[]} A list of matching members.
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
   * @returns {(Channel | User)[]} A list of matched results.
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
}
