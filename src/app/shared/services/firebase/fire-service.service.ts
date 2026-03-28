import { computed, inject, Injectable, Injector, signal } from '@angular/core';
import {
  addDoc,
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  Firestore,
  getDocs,
  onSnapshot,
  updateDoc,
} from '@angular/fire/firestore';
import { Message } from '../../../features/app_chat/models/message/message';
import { User } from '../../../features/app_auth/models/user/user';
import { AuthService } from '../../../features/app_auth/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class FireServiceService {
  public firestore: Firestore = inject(Firestore);
  private injector = inject(Injector);
  public allUsers = signal<User[]>([]);
  private _allChannels = signal<any[]>([]);

  /**
   * Updates the online status of the current user in Firestore.
   *
   * @param currentUser The user object containing the UID and online status.
   */
  async updateOnlineStatus(currentUser: any) {
    if (currentUser.uid) {
      const userRef = doc(this.firestore, 'users', currentUser.uid);
      await updateDoc(userRef, {
        online: currentUser.online,
      });
    }
  }

  /**
   * Erstellt eine permanente Verbindung zur User-Collection.
   * Jede Änderung (Login/Logout/Neuer User) triggert das Signal sofort.
   */
  subAllUsers() {
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
   * Adds a thread message to Firestore.
   *
   * @param messageDocRef The reference to the parent message document.
   * @param messageObject The message object to be added.
   * @returns A promise that resolves when the thread message is added.
   */
  async addThreadMessageData(messageDocRef: DocumentReference, messageObject: any) {
    await updateDoc(messageDocRef, new Message(messageObject).toJSON());
  }

  /**
   * Sends a message to a specific channel.
   *
   * @param channelId The ID of the channel.
   * @param messageObject The message object to be sent.
   * @returns A promise that resolves when the message is sent.
   */
  async sendMessage(channelId: string, messageObject: any) {
    let messagesCollectionRef: CollectionReference | null = this.getCollectionRef(`channels/${channelId}/messages`);
    if (messagesCollectionRef) {
      let messageDocRef = await addDoc(messagesCollectionRef, new Message(messageObject).toJSON());
      this.addThreadMessageData(messageDocRef, messageObject);
    }
  }

  /**
   * Sends a thread message to a specific channel.
   *
   * @param channelId The ID of the channel.
   * @param messageObject The message object to be sent.
   * @param parentMessageId The ID of the parent message.
   * @returns A promise that resolves when the thread message is sent.
   */
  async sendThreadMessage(channelId: string, messageObject: any, parentMessageId: string) {
    let messagesCollectionRef: CollectionReference | null = this.getCollectionRef(
      `channels/${channelId}/messages/${parentMessageId}/thread`,
    );
    if (messagesCollectionRef) {
      await addDoc(messagesCollectionRef, new Message(messageObject).toJSON());
    }
  }
}
