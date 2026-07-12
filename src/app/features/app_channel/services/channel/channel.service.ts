import { computed, inject, Injectable, signal } from '@angular/core';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { User } from '../../../app_auth/models/user/user';
import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { Channel } from '../../models/channel/channel';

@Injectable({
  providedIn: 'root',
})
export class ChannelService {
  constructor() {
    this.fireService.subAllUsers();
  }

  private readonly fireService = inject(FireServiceService);
  private readonly authService = inject(AuthService);

  public currentChannel = signal<Channel | null>(null);
  public selectedUsers = signal<User[]>([]);
  public userSearchQuery = signal('');
  public allMembersSelected = signal<boolean>(false);

  public enrichedMembers = computed(() => {
    const allUsers = this.fireService.allUsers();
    const channelMembers = this.currentChannel()?.member || [];

    return channelMembers.map((member) => {
      const memberId = member.id.toString();
      const liveUser = allUsers.find((u) => u.id === memberId);
      if (liveUser) {
        return {
          ...liveUser,
          id: member.id.toString(),
        } as User;
      }

      return {
        id: member.id.toString(),
        displayName: 'Unbekannter Nutzer',
        photoUrl: 'assets/img/avatar.png',
        online: false,
        email: '',
      } as User;
    });
  });

  public filteredUsers = computed(() => {
    const allUsers = this.fireService.allUsers();
    const members = this.currentChannel()?.member || [];
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

  public membersToSubmit = computed(() => {
    const currentUser = this.authService.currentUser();
    const allUsers = this.fireService.allUsers();
    const selectedUsers = this.selectedUsers();

    if (this.allMembersSelected()) {
      return allUsers.map((u) => ({ id: u.id }));
    } else {
      const selected = selectedUsers.map((u) => ({ id: u.id }));

      if (currentUser && !selected.some((m) => m.id === currentUser.id)) {
        selected.push({ id: currentUser.id });
      }
      return selected;
    }
  });

  public canSubmit = computed(() => {
    if (this.isSubmitting()) return false;
    if (this.allMembersSelected()) return true;

    return this.selectedUsers().length > 0;
  });

  private isSubmitting = signal<boolean>(false);

  async createChannel(channelData: Channel) {
    try {
      this.isSubmitting.set(true);
      await this.fireService.addChannel(channelData);
    } catch (error) {
      throw error;
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public addUserToSelection(user: User) {
    this.allMembersSelected.set(false);
    this.selectedUsers.update((users) => {
      if (users.find((u) => u.id === user.id)) return users;
      return [...users, user];
    });
    this.userSearchQuery.set('');
  }

  public removeUserFromSelection(index: number) {
    this.selectedUsers.update((users) => {
      const updatedUsers = [...users];
      updatedUsers.splice(index, 1);
      return updatedUsers;
    });
  }

  public resetSelection() {
    this.selectedUsers.set([]);
    this.userSearchQuery.set('');
  }

  public updateSearchQuery(query: string) {
    this.userSearchQuery.set(query);
  }

  public async updateName(id: string, name: string) {
    await this.fireService.updateChannelData(id, { name });
    this.currentChannel.update((c) => ({ ...c, name }) as Channel);
  }

  public async updateDescription(id: string, description: string) {
    await this.fireService.updateChannelData(id, { description });
    this.currentChannel.update((c) => ({ ...c, description }) as Channel);
  }

  public async addMembers(id: string, userObjects: { id: string }[]) {
    if (!id || !userObjects || userObjects.length === 0) return;

    try {
      this.isSubmitting.set(true);

      await this.fireService.addChannelMembers(id, userObjects);

      this.currentChannel.update((current) => {
        if (!current) return null;

        const existingIds = new Set((current.member || []).map((m: any) => m.id));
        const newUniqueMembers = userObjects.filter((obj) => !existingIds.has(obj.id));

        return {
          ...current,
          member: [...(current.member || []), ...newUniqueMembers],
        } as Channel;
      });

      this.resetSelection();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Mitglieder:', error);
      throw error;
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public async leaveChannel() {
    const currentUser = this.authService.currentUser();
    const channelId = this.currentChannel()?.id;

    if (currentUser?.id && channelId) {
      await this.fireService.leaveChannel(channelId, currentUser.id);
    }
  }
}
