import { inject, Injectable } from '@angular/core';
import { addDoc, arrayUnion, collection, CollectionReference, doc, DocumentReference, Firestore, updateDoc } from '@angular/fire/firestore';
import { ChannelMessage, Reaction } from '../../../features/chat/models/channel-message/channel-message';
import { runWrite } from '../../utils/run-write.util';

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
   * Resolves the message document ref, taking into account whether the
   * message lives in a thread reply — the one place this branch should exist.
   */
  getMessageRefForContext(
    channelId: string,
    messageId: string,
    parentMessageId?: string,
    isThread?: boolean,
  ): DocumentReference | null {
    return isThread && parentMessageId
      ? this.getMessageThreadRef(channelId, parentMessageId, messageId)
      : this.getMessageRef(channelId, messageId);
  }

  /**
   * Reference to a channel's messages collection.
   */
  getMessagesCollectionRef(channelId: string): CollectionReference | null {
    return channelId ? collection(this.firestore, `channels/${channelId}/messages`) : null;
  }

  /**
   * Reference to a thread's reply collection.
   */
  getThreadCollectionRef(channelId: string, parentMessageId: string): CollectionReference | null {
    return channelId && parentMessageId ? collection(this.firestore, `channels/${channelId}/messages/${parentMessageId}/thread`) : null;
  }

  /**
   * Reference to one side of a direct-message conversation.
   */
  getConversationMessagesCollectionRef(userId: string, conversationId: string): CollectionReference | null {
    return userId && conversationId ? collection(this.firestore, `users/${userId}/conversations/${conversationId}/messages`) : null;
  }

  /**
   * Updates a message document in Firestore.
   *
   * @param ref The reference to the message document.
   * @param value The updated message value.
   * @returns A promise that resolves when the update is complete.
   */
  updateMessage(ref: DocumentReference, value: string) {
    return ref ? runWrite(() => updateDoc(ref, { message: value }), 'Fehler beim Aktualisieren der Nachricht:') : null;
  }

  /**
   * Updates the reaction on a message in Firestore.
   *
   * @param ref The reference to the message document.
   * @param value The updated reaction value.
   * @returns A promise that resolves when the update is complete.
   */
  updateReaction(ref: DocumentReference, value: Reaction[]) {
    return ref ? runWrite(() => updateDoc(ref, { reaction: value }), 'Fehler beim Aktualisieren der Reaktion:') : null;
  }

  /**
   * Sends a message to a specific channel.
   *
   * @param channelId The ID of the channel.
   * @param data The message object to be sent.
   * @returns A promise that resolves when the message is sent.
   */
  async postChannelMessage(channelId: string, data: any) {
    return runWrite(async () => {
      const messagesRef = this.getMessagesCollectionRef(channelId);
      if (!messagesRef) return;

      const messageDocRef = await addDoc(messagesRef, data);
      await this.initializeThreadData(messageDocRef, data);
    }, 'Fehler beim Senden der Channel-Nachricht:');
  }

  private async initializeThreadData(docRef: DocumentReference, messageObject: any) {
    await updateDoc(docRef, new ChannelMessage(messageObject).toJSON());
  }

  public async postDirectMessage(senderId: string, receiverId: string, conversationId: string, messageData: any) {
    return runWrite(async () => {
      const senderRef = this.getConversationMessagesCollectionRef(senderId, conversationId);
      const receiverRef = this.getConversationMessagesCollectionRef(receiverId, conversationId);
      if (!senderRef || !receiverRef) return;

      await Promise.all([addDoc(senderRef, messageData), senderId !== receiverId ? addDoc(receiverRef, messageData) : Promise.resolve()]);
    }, 'Fehler beim Senden der Direktnachricht:');
  }

  public async postThreadMessage(channelId: string, parentMessageId: string, data: any) {
    return runWrite(async () => {
      const threadRef = this.getThreadCollectionRef(channelId, parentMessageId);
      const parentRef = this.getMessageRef(channelId, parentMessageId);
      if (!threadRef || !parentRef) return;

      await addDoc(threadRef, data);
      await updateDoc(parentRef, { thread: arrayUnion({ time: this.formatTime(new Date()) }) });
    }, 'Fehler beim Senden der Thread-Antwort:');
  }

  /**
   * `arrayUnion` entries can't contain `serverTimestamp()`, so the reply
   * counter on the parent doc stores a plain preformatted HH:mm string.
   */
  private formatTime(date: Date): string {
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  }
}
