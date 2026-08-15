import { computed, inject, Injectable, signal } from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  doc,
  Firestore,
  getDoc,
  getDocs,
  onSnapshot,
  query,
  updateDoc,
  where,
} from '@angular/fire/firestore';
import { Channel } from '../../../features/channel/models/channel/channel';
import { DEFAULT_CHANNEL_ID, GUEST_EMAIL } from '../../constants';
import { UserStore } from '../user/user-store';
import { toEntity } from '../../utils/firestore-entity.util';
import { runWrite } from '../../utils/run-write.util';

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
      const data = snapshot.docs.map((doc) => toEntity<Channel>(doc.id, doc.data()));
      this._allChannels.set(data);
    });
  }

  /**
   * Subscribes to live changes of a single channel document
   * (the active channel, driven by the route param).
   */
  public subChannelDoc(channelId: string, callback: (channel: Channel | null) => void): () => void {
    const channelRef = doc(this.firestore, 'channels', channelId);
    return onSnapshot(channelRef, (snap) => {
      callback(snap.exists() ? toEntity<Channel>(snap.id, snap.data()) : null);
    });
  }

  /**
   * One-off fetch of a single channel document (e.g. to read its member
   * list at message-send time) — unlike subChannelDoc, no listener stays open.
   */
  public async getChannelOnce(channelId: string): Promise<Channel | null> {
    const channelRef = doc(this.firestore, 'channels', channelId);
    const snap = await getDoc(channelRef);
    return snap.exists() ? toEntity<Channel>(snap.id, snap.data()) : null;
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

  public async addChannel(data: any) {
    return runWrite(() => {
      const channelsRef = collection(this.firestore, 'channels');
      return addDoc(channelsRef, data);
    }, 'Fehler beim Erstellen des Channels in Firestore:');
  }

  public async updateChannelData(channelId: string, data: Partial<{ name: string; description: string }>) {
    if (!channelId) return;

    const channelRef = doc(this.firestore, 'channels', channelId);
    return runWrite(() => updateDoc(channelRef, data), 'Fehler beim Aktualisieren der Channel-Daten:');
  }

  public async addChannelMembers(channelId: string, memberObjects: { id: string }[]) {
    if (!channelId || memberObjects.length === 0) return;

    const channelRef = doc(this.firestore, 'channels', channelId);
    return runWrite(
      () => updateDoc(channelRef, { member: arrayUnion(...memberObjects) }),
      'Fehler beim Hinzufügen von Mitgliedern:',
    );
  }

  public async leaveChannel(channelId: string, userId: string) {
    const channelRef = doc(this.firestore, 'channels', channelId);
    return runWrite(() => updateDoc(channelRef, { member: arrayRemove({ id: userId }) }), 'Fehler beim Verlassen des Channels:');
  }

  public async checkChannelNameExists(name: string): Promise<boolean> {
    return (await this.findChannelByName(name)) !== null;
  }

  /**
   * Looks up a channel document by its name (used for #mentions and the
   * unique-name check when creating a channel).
   */
  public async findChannelByName(name: string): Promise<Channel | null> {
    const channelsRef = collection(this.firestore, 'channels');
    const q = query(channelsRef, where('name', '==', name.trim()));
    const snapshot = await getDocs(q);
    const docSnap = snapshot.docs[0];
    return docSnap ? toEntity<Channel>(docSnap.id, docSnap.data()) : null;
  }
}
