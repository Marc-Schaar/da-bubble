import { inject, Injectable, Query, signal } from '@angular/core';
import { onSnapshot, orderBy, query, QuerySnapshot, serverTimestamp } from '@angular/fire/firestore';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { UserService } from '../../../../shared/services/user/shared.service';
import { ChannelMessage } from '../../models/channel-message/channel-message';
import { DirectMessage } from '../../models/direct-message/direct-message';
import { AuthService } from '../../../app_auth/services/auth/auth.service';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  private fireService = inject(FireServiceService);
  private readonly authService = inject(AuthService);
  email = 'gianniskarakasidhs@hotmail.com';

  public messages = signal<ChannelMessage[] | DirectMessage[]>([]);

  constructor() {
    console.log(this.authService.currentUser());
  }

  public subToMessages(channelId: string | null) {
    if (!channelId) return () => {};
    const messagesRef = this.fireService.getCollectionRef(`channels/${channelId}/messages`);
    if (!messagesRef) return () => {};

    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(messagesQuery, (snapshot) => {
      this.messages.set(this.processData(snapshot));
    });
  }

  public subToConversationMessages(userA: string, userB: string): () => void {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return () => {};

    const [uid1, uid2] = [userA, userB].sort();
    const conversationId = `${uid1}_${uid2}`;

    const messagesRef = this.fireService.getCollectionRef(`users/${currentUserId}/conversations/${conversationId}/messages`);

    if (!messagesRef) return () => {};

    const messagesQuery = query(messagesRef, orderBy('timestamp', 'asc'));

    return onSnapshot(messagesQuery, (snapshot) => {
      const processedMessages = this.processData(snapshot);
      this.messages.set(processedMessages);
    });
  }

  /**
   * @description - Processes snapshot data and returns an array of formatted messages.
   * @param snap - The Firestore snapshot containing the messages.
   * @returns An array of processed message objects.
   */
  public processData(snap: QuerySnapshot<any>): any[] {
    return snap.docs.map((doc: any) => {
      const data = doc.data();
      const id = doc.id;
      return this.isChannelMessage(data) ? new ChannelMessage({ id, ...data }) : new DirectMessage({ id, ...data });
    });
  }

  private isChannelMessage(data: any): boolean {
    return 'reaction' in data;
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
      photoUrl: this.authService.currentUser()?.photoUrl,
      date: new Date().toISOString().split('T')[0],
      name: this.authService.currentUser()?.displayName,
      newDay: this.isNewDay(messages),
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
      name: this.authService.currentUser()?.displayName,
      photoUrl: this.authService.currentUser()?.photoUrl,
      message: input,
      date: new Date().toISOString().split('T')[0],
      timestamp: serverTimestamp(),
      from: from,
      to: to,
      newDay: this.isNewDay(messages),
    };
  }
}
