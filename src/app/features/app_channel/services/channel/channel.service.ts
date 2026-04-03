import { computed, inject, Injectable, signal } from '@angular/core';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { User } from '../../../app_auth/models/user/user';
import { AuthService } from '../../../app_auth/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  constructor() {
    this.fireService.subAllUsers();
  }

  private readonly fireService = inject(FireServiceService);
  private readonly authService = inject(AuthService);

  public currentChannel = signal<any>(null);

  public selectedUsers = signal<User[]>([]);

  public userSearchQuery = signal('');

  public enrichedMembers = computed(() => {
    const allUsers = this.fireService.allUsers();
    const channelMembers = this.currentChannel().member || [];

    return channelMembers.map((member: User) => {
      const liveUser = allUsers.find((u) => u.id === member.id);
      if (!liveUser) return member;

      return {
        ...member,
        displayName: liveUser.displayName,
        photoUrl: liveUser.photoUrl,
        online: liveUser.online,
      };
    });
  });

  public filteredUsers = computed(() => {
    const allUsers = this.fireService.allUsers();
    const members = this.currentChannel().member || [];
    const currentUser = this.authService.currentUser();
    const currentSelection = this.selectedUsers();
    const query = this.userSearchQuery().toLowerCase();

    return allUsers.filter((user) => {
      const isNotMember = !members.some((m: any) => m.id === user.id);
      const isNotSelected = !currentSelection.some((u) => u.id === user.id);
      const isNotMe = user.id !== currentUser?.id;
      const matchesQuery = user.displayName.toLowerCase().includes(query);
      const hasEmail = !!user.email;

      return isNotMember && isNotSelected && isNotMe && matchesQuery && hasEmail;
    });
  });

  async updateName(id: string, name: string) {
    await this.fireService.updateChannelData(id, { name });
    this.currentChannel.update((c) => ({ ...c, name }));
  }

  async updateDescription(id: string, description: string) {
    await this.fireService.updateChannelData(id, { description });
    this.currentChannel.update((c) => ({ ...c, description }));
  }

  async addMembers(id: string, userObjects: { id: string }[]) {
    await this.fireService.addChannelMembers(id, userObjects);
    this.currentChannel.update((c) => ({
      ...c,
      member: [...(c.member || []), ...userObjects],
    }));
  }

  public async leaveChannel() {
    const currentUser = this.authService.currentUser();
    const channelId = this.currentChannel()?.id;

    if (currentUser?.id && channelId) {
      await this.fireService.leaveChannel(channelId, currentUser.id);
    }
  }
}
