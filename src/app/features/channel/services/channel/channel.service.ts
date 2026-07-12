import { computed, inject, Injectable, signal } from '@angular/core';
import { getDocs, onSnapshot, query, where } from '@angular/fire/firestore';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { User } from '../../../auth/models/user/user';
import { AuthService } from '../../../auth/services/auth/auth.service';
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
  private unsubCurrentChannel?: () => void;
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

  /**
   * Single source of truth for the active channel: holds THE one
   * Firestore listener on the channel document (derived from the route
   * param) and feeds the currentChannel signal. Passing null clears it.
   */
  public setActiveChannel(id: string | null): void {
    this.unsubCurrentChannel?.();
    this.unsubCurrentChannel = undefined;

    if (!id) {
      this.currentChannel.set(null);
      return;
    }

    const channelRef = this.fireService.getDocRef('channels', id);
    if (!channelRef) return;

    this.unsubCurrentChannel = onSnapshot(channelRef, (snap) => {
      this.currentChannel.set(snap.exists() ? ({ id: snap.id, ...snap.data() } as Channel) : null);
    });
  }

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
  }

  public async updateDescription(id: string, description: string) {
    await this.fireService.updateChannelData(id, { description });
  }

  public async addMembers(id: string, userObjects: { id: string }[]) {
    if (!id || !userObjects || userObjects.length === 0) return;

    try {
      this.isSubmitting.set(true);

      await this.fireService.addChannelMembers(id, userObjects);
      this.resetSelection();
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Mitglieder:', error);
      throw error;
    } finally {
      this.isSubmitting.set(false);
    }
  }

  /**
   * Looks up a channel document by its name (used for #mentions).
   */
  public async findChannelByName(name: string): Promise<Channel | null> {
    const channelsRef = this.fireService.getCollectionRef('channels');
    if (!channelsRef) return null;

    const q = query(channelsRef, where('name', '==', name.trim()));
    const snapshot = await getDocs(q);
    const docSnap = snapshot.docs[0];
    return docSnap ? ({ id: docSnap.id, ...docSnap.data() } as Channel) : null;
  }

  public async leaveChannel() {
    const currentUser = this.authService.currentUser();
    const channelId = this.currentChannel()?.id;

    if (currentUser?.id && channelId) {
      await this.fireService.leaveChannel(channelId, currentUser.id);
    }
  }
}
