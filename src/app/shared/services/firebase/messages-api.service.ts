import { inject, Injectable } from '@angular/core';
import { addDoc, collection, doc, DocumentReference, Firestore, updateDoc } from '@angular/fire/firestore';
import { ChannelMessage, Reaction } from '../../../features/chat/models/channel-message/channel-message';

/**
 * Kapselt den Firestore-Zugriff auf Channel-, Direkt- und Thread-Nachrichten.
 */
@Injectable({
  providedIn: 'root',
})
export class MessagesApiService {
  private firestore: Firestore = inject(Firestore);

  /**
   * Returns a reference to a specific message document in Firestore.
   *
   * @param channelId The ID of the channel.
   * @param messageId The ID of the message.
   * @returns A DocumentReference or null if the channelId or messageId is invalid.
   */
  getMessageRef(channelId: string, messageId: string): DocumentReference | null {
    return channelId && messageId ? doc(this.firestore, `channels/${channelId}/messages`, messageId) : null;
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
      ? doc(this.firestore, `channels/${channelId}/messages/${messageId}/thread`, threadMessageID)
      : null;
  }

  /**
   * Updates a message document in Firestore.
   *
   * @param ref The reference to the message document.
   * @param value The updated message value.
   * @returns A promise that resolves when the update is complete.
   */
  updateMessage(ref: DocumentReference, value: string) {
    return ref ? updateDoc(ref, { message: value }) : null;
  }

  /**
   * Updates the reaction on a message in Firestore.
   *
   * @param ref The reference to the message document.
   * @param value The updated reaction value.
   * @returns A promise that resolves when the update is complete.
   */
  updateReaction(ref: DocumentReference, value: Reaction[]) {
    return ref ? updateDoc(ref, { reaction: value }) : null;
  }

  /**
   * Sends a message to a specific channel.
   *
   * @param channelId The ID of the channel.
   * @param data The message object to be sent.
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
}
