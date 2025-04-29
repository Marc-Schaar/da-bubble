import { inject, Injectable } from '@angular/core';
import { onSnapshot, orderBy, query, serverTimestamp } from '@angular/fire/firestore';
import { FireServiceService } from '../../fire-service.service';
import { UserService } from '../../shared.service';
import { DirectMessage } from '../../models/direct-message/direct-message';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  constructor() {}
  private fireService = inject(FireServiceService);
  private userService = inject(UserService);

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

  private isNewDay(messages: any): boolean {
    if (messages.length === 0) return true;
    let lastMessage = messages[messages.length - 1];
    let lastMessageDate = lastMessage.date ? lastMessage.date : lastMessage.time;
    let todayDate = new Date().toISOString().split('T')[0];
    return lastMessageDate !== todayDate;
  }

  public isToday(date: any): boolean {
    if (!date) return false;
    let today = new Date().toISOString().split('T')[0];
    let messageDate = new Date(date).toISOString().split('T')[0];

    return today === messageDate;
  }

  private formateDate(data: any) {
    return new Date(data).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

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
