import { computed, inject, Injectable, Injector, signal } from '@angular/core';
import {
  addDoc,
  arrayRemove,
  arrayUnion,
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  Firestore,
  getDocs,
  onSnapshot,
  updateDoc,
} from '@angular/fire/firestore';
import { ChannelMessage } from '../../../features/app_chat/models/channel-message/channel-message';
import { User } from '../../../features/app_auth/models/user/user';
import { AuthService } from '../../../features/app_auth/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class FireServiceService {
  private firestore: Firestore = inject(Firestore);
  private injector = inject(Injector);
  public allUsers = signal<User[]>([]);
  private _allChannels = signal<any[]>([]);

  /**
   * Updates the online status of the current user in Firestore.
   *
   * @param currentUser The user object containing the UID and online status.
   */
  async updateOnlineStatus(currentUser: User) {
    if (currentUser.id) {
      const userRef = doc(this.firestore, 'users', currentUser.id);
      await updateDoc(userRef, {
        online: currentUser.online,
      });
    }
  }

  /**
   * Erstellt eine permanente Verbindung zur User-Collection.
   * Jede Änderung (Login/Logout/Neuer User) triggert das Signal sofort.
   */
  public subAllUsers() {
    const usersCollection = collection(this.firestore, 'users');

    return onSnapshot(
      usersCollection,
      (snapshot) => {
        const users = snapshot.docs.map(
          (doc) =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as User,
        );

        this.allUsers.set(users);
        console.log(users);
      },
      (error) => {
        console.error('Fehler beim User-Streaming:', error);
      },
    );
  }

  public myChannels = computed(() => {
    const authService = this.injector.get(AuthService);
    const channels = this._allChannels();
    const currentUser = authService.currentUser();
    const DEFAULT_CHANNEL_ID = 'KqvcY68R1jP2UsQkv6Nz';

    if (!currentUser) return [];

    return channels.filter((channel) => {
      if (currentUser.email === 'gast@portfolio.de') {
        return channel.id === DEFAULT_CHANNEL_ID;
      }

      return channel.member?.some((m: any) => m.id === currentUser.id);
    });
  });

  /**
   * Startet den Echtzeit-Stream für alle Channels
   */
  public subChannels() {
    const channelRef = collection(this.firestore, 'channels');

    return onSnapshot(channelRef, (snapshot) => {
      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      this._allChannels.set(data);
    });
  }

  /**
   * Retrieves all channels from Firestore.
   *
   * @returns A promise that resolves with an array of channel objects.
   * @throws If there is an error fetching channels from Firestore.
   */
  async getChannels() {
    try {
      const channelCollection = collection(this.firestore, 'channels');
      const channelSnapshot = await getDocs(channelCollection);
      return channelSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw error;
    }
  }

  /**
   * Returns a reference to a specific document in Firestore.
   *
   * @param ref The collection name.
   * @param id The document ID.
   * @returns A DocumentReference or null if the ref or id is invalid.
   */
  getDocRef(ref: string, id: string): DocumentReference | null {
    return ref && id ? doc(this.firestore, ref, id) : null;
  }

  /**
   * Returns a reference to a specific collection in Firestore.
   *
   * @param ref The collection name.
   * @returns A CollectionReference or null if the ref is invalid.
   */
  getCollectionRef(ref: string): CollectionReference | null {
    return ref ? collection(this.firestore, ref) : null;
  }

  /**
   * Returns a reference to a specific message document in Firestore.
   *
   * @param channelId The ID of the channel.
   * @param messageId The ID of the message.
   * @returns A DocumentReference or null if the channelId or messageId is invalid.
   */
  getMessageRef(channelId: string, messageId: string): DocumentReference | null {
    return channelId && messageId ? this.getDocRef(`channels/${channelId}/messages`, messageId) : null;
  }

  /**
   * Returns a reference to a specific thread message document in Firestore.
   *
   * @param channelId The ID of the channel.
   * @param messageId The ID of the message.
   * @param threadMessageID The ID of the thread message.
   * @returns A DocumentReference or null if the channelId, messageId, or threadMessageID is invalid.
   */
  getMessageThreadRef(channelId: string, messageId: string, threadMessageID: string): DocumentReference | null {
    return channelId && messageId && threadMessageID
      ? this.getDocRef(`channels/${channelId}/messages/${messageId}/thread`, threadMessageID)
      : null;
  }

  /**
   * Updates a message document in Firestore.
   *
   * @param ref The reference to the message document.
   * @param value The updated message value.
   * @returns A promise that resolves when the update is complete.
   */
  updateMessage(ref: DocumentReference, value: any) {
    return ref ? updateDoc(ref, { message: value }) : null;
  }

  /**
   * Updates the reaction on a message in Firestore.
   *
   * @param ref The reference to the message document.
   * @param value The updated reaction value.
   * @returns A promise that resolves when the update is complete.
   */
  updateReaction(ref: DocumentReference, value: any) {
    return ref ? updateDoc(ref, { reaction: value }) : null;
  }

  /**
   * Sends a message to a specific channel.
   *
   * @param channelId The ID of the channel.
   * @param messageObject The message object to be sent.
   * @returns A promise that resolves when the message is sent.
   */
  async postChannelMessage(channelId: string, data: any) {
    const path = `channels/${channelId}/messages`;
    const messagesRef = collection(this.firestore, path);

    const messageDocRef = await addDoc(messagesRef, data);

    await this.initializeThreadData(messageDocRef, data);
  }

  private async initializeThreadData(docRef: DocumentReference, messageObject: any) {
    await updateDoc(docRef, new ChannelMessage(messageObject).toJSON());
  }

  public async postDirectMessage(
    senderPath: string,
    receiverPath: string,
    senderId: string | undefined,
    receiverId: string,
    messageData: any,
  ) {
    const senderRef = collection(this.firestore, senderPath);
    const receiverRef = collection(this.firestore, receiverPath);

    await Promise.all([addDoc(senderRef, messageData), senderId !== receiverId ? addDoc(receiverRef, messageData) : Promise.resolve()]);
  }

  public async postThreadMessage(channelId: string, parentMessageId: string, data: any) {
    const path = `channels/${channelId}/messages/${parentMessageId}/thread`;
    const threadRef = collection(this.firestore, path);

    await addDoc(threadRef, data);
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
}
