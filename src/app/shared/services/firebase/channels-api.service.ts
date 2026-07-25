import { computed, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  Firestore,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Channel } from '../../../features/channel/models/channel/channel';
import { DEFAULT_CHANNEL_ID, GUEST_EMAIL } from '../../constants';
import { UserStore } from '../user/user-store';

/**
 * Kapselt den Firestore-Zugriff auf die `channels`-Collection.
 */
@Injectable({
  providedIn: 'root',
})
export class ChannelsApiService {
  private firestore: Firestore = inject(Firestore);
  private userStore = inject(UserStore);
  private _allChannels = signal<Channel[]>([]);
  private unsubChannels?: () => void;

  /**
   * Startet den Echtzeit-Stream für alle Channels.
   * Idempotent wie subAllUsers().
   */
  public subChannels(): void {
    if (this.unsubChannels) return;
    const channelRef = collection(this.firestore, 'channels');

    this.unsubChannels = onSnapshot(channelRef, (snapshot) => {
      const data = snapshot.docs.map(
        (doc) =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as Channel,
      );
      this._allChannels.set(data);
    });
  }

  public myChannels = computed(() => {
    const channels: Channel[] = this._allChannels();
    const currentUser = this.userStore.currentUser();

    if (!currentUser) return [];

    const isGuest = currentUser.email === GUEST_EMAIL;
    return channels.filter((channel) => {
      if (isGuest) {
        return channel.id === DEFAULT_CHANNEL_ID || channel.createdBy === currentUser.id;
      }
      return channel.member.some((m: { id: string }) => m.id === currentUser.id);
    });
  });

  async addChannel(data: any) {
    try {
      const channelsRef = collection(this.firestore, 'channels');
      return await addDoc(channelsRef, data);
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels in Firestore:', error);
      throw error;
    }
  }

  async updateChannelData(channelId: string, data: Partial<{ name: string; description: string }>) {
    if (!channelId) return;

    const channelRef = doc(this.firestore, 'channels', channelId);
    try {
      await updateDoc(channelRef, data);
    } catch (error) {
      console.error('Fehler beim Aktualisieren der Channel-Daten:', error);
      throw error;
    }
  }

  async addChannelMembers(channelId: string, memberObjects: { id: string }[]) {
    if (!channelId || memberObjects.length === 0) return;

    const channelRef = doc(this.firestore, 'channels', channelId);
    try {
      await updateDoc(channelRef, {
        member: arrayUnion(...memberObjects),
      });
    } catch (error) {
      console.error('Fehler beim Hinzufügen von Mitgliedern:', error);
      throw error;
    }
  }

  public async leaveChannel(channelId: string, userId: string) {
    const channelRef = doc(this.firestore, 'channels', channelId);

    try {
      await updateDoc(channelRef, {
        member: arrayRemove({ id: userId }),
      });
    } catch (error) {
      console.error('Fehler beim Verlassen des Channels:', error);
      throw error;
    }
  }

  public async checkChannelNameExists(name: string): Promise<boolean> {
    const channelsRef = collection(this.firestore, 'channels');
    const trimmedName = name.trim();

    const q = query(channelsRef, where('name', '==', trimmedName));
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  }
}
