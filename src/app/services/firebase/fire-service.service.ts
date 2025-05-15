import { inject, Injectable } from '@angular/core';
import { addDoc, collection, CollectionReference, doc, DocumentReference, Firestore, getDocs, updateDoc } from '@angular/fire/firestore';
import { Message } from '../../models/message/message';

@Injectable({
  providedIn: 'root',
})
export class FireServiceService {
  firestore: Firestore = inject(Firestore);

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
   * Retrieves all users from Firestore.
   *
   * @returns A promise that resolves with an array of user objects.
   * @throws If there is an error fetching users from Firestore.
   */
  async getUsers() {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const userSnapshot = await getDocs(usersCollection);
      return userSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      throw error;
    }
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
      `channels/${channelId}/messages/${parentMessageId}/thread`
    );
    if (messagesCollectionRef) {
      await addDoc(messagesCollectionRef, new Message(messageObject).toJSON());
    }
  }
}
