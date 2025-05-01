import { inject, Injectable } from '@angular/core';
import { onSnapshot, orderBy, query, serverTimestamp } from '@angular/fire/firestore';
import { FireServiceService } from '../../fire-service.service';
import { UserService } from '../../shared.service';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private fireService = inject(FireServiceService);
  private userService = inject(UserService);

  /**
   * @description - Retrieves messages from a specific channel and listens for updates.
   * @param channelId - The ID of the channel to fetch messages for.
   * @param onUpdate - Callback function that is called with the updated messages.
   * @returns A function to unsubscribe from the message updates.
   */
  public getChannelMessages(channelId: string, onUpdate: (messages: any[]) => void): () => void {
    const messagesRef = this.fireService.getCollectionRef(`channels/${channelId}/messages`);
    if (messagesRef) {
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
      return onSnapshot(messagesQuery, (snapshot) => {
        const processedMessages = this.processData(snapshot);
        onUpdate(processedMessages);
      });
    }
    return () => {};
  }

  /**
   * @description - Retrieves messages from a conversation between two users and listens for updates.
   * @param userA - The ID of the first user in the conversation.
   * @param userB - The ID of the second user in the conversation.
   * @param onUpdate - Callback function that is called with the updated messages.
   * @returns A function to unsubscribe from the conversation message updates.
   */
  public getConversationMessages(userA: string, userB: string, onUpdate: (messages: any[]) => void): () => void {
    const currentUserId = this.userService.currentUser?.uid;
    const [uid1, uid2] = [userA, userB].sort();
    const conversationId = `${uid1}_${uid2}`;
    const messagesRef = this.fireService.getCollectionRef(`users/${currentUserId}/conversations/${conversationId}/messages`);
    if (messagesRef) {
      const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));
      return onSnapshot(messagesQuery, (snapshot) => {
        const processedMessages = this.processData(snapshot);
        onUpdate(processedMessages);
      });
    }
    return () => {};
  }

  /**
   * @description - Processes snapshot data and returns an array of formatted messages.
   * @param snap - The Firestore snapshot containing the messages.
   * @returns An array of processed message objects.
   */
  processData(snap: any) {
    return snap.docs.map((doc: any) => {
      let data = doc.data();
      return {
        id: doc.id,
        ...data,
        time: data['timestamp']
          ? new Date(data['timestamp'].toDate()).toLocaleTimeString('de-DE', {
              hour: '2-digit',
              minute: '2-digit',
            })
          : '–',
      };
    });
  }

  /**
   * @description - Determines if a new day has started based on the last message in the array.
   * @param messages - The array of messages to check.
   * @returns A boolean indicating whether a new day has started.
   */
  private isNewDay(messages: any): boolean {
    if (messages.length === 0) return true;
    let lastMessage = messages[messages.length - 1];
    let lastMessageDate = lastMessage.date ? lastMessage.date : lastMessage.time;
    let todayDate = new Date().toISOString().split('T')[0];
    return lastMessageDate !== todayDate;
  }

  /**
   * @description - Checks if the provided date corresponds to today's date.
   * @param date - The date to check.
   * @returns A boolean indicating if the date is today.
   */
  public isToday(date: any): boolean {
    if (!date) return false;
    let today = new Date().toISOString().split('T')[0];
    let messageDate = new Date(date).toISOString().split('T')[0];
    return today === messageDate;
  }

  /**
   * @description - Formats a date into a human-readable string in the German locale.
   * @param data - The date to format.
   * @returns A formatted date string.
   */
  public formateDate(data: any) {
    return new Date(data).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  /**
   * @description - Builds an object for a channel message to be sent to Firestore.
   * @param input - The content of the message.
   * @param messages - The current list of messages (optional).
   * @param reactions - Any reactions to the message (optional).
   * @returns An object representing the channel message.
   */
  public buildChannelMessageObject(input: string, messages?: any, reactions?: any): {} {
    return {
      message: input || '',
      avatar: this.userService.currentUser?.photoURL || '',
      date: new Date().toISOString().split('T')[0],
      name: this.userService.currentUser?.displayName || 'Gast',
      newDay: this.isNewDay(messages),
      timestamp: serverTimestamp(),
      reaction: reactions || [],
    };
  }

  /**
   * @description - Builds an object for a direct message to be sent to Firestore.
   * @param input - The content of the message.
   * @param messages - The current list of messages (used for the "new day" logic).
   * @param from - The sender's user ID.
   * @param to - The recipient's user ID.
   * @returns An object representing the direct message.
   */
  public buildDirectMessageObject(input: string, messages: any, from: string, to: string) {
    return {
      name: this.userService.currentUser?.displayName || 'Gast',
      avatar: this.userService.currentUser?.photoURL || '',
      message: input,
      date: new Date().toISOString().split('T')[0],
      timestamp: serverTimestamp(),
      from: from,
      to: to,
      newDay: this.isNewDay(messages),
    };
  }
}
