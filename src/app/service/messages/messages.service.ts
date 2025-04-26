import { inject, Injectable } from '@angular/core';
import { onSnapshot, orderBy, query, serverTimestamp } from '@angular/fire/firestore';
import { FireServiceService } from '../../fire-service.service';
import { UserService } from '../../shared.service';

@Injectable({
  providedIn: 'root',
})
export class MessagesService {
  constructor() {}
  private fireService = inject(FireServiceService);
  private userService = inject(UserService);

  getChannelMessages(channelId: string, onUpdate: (messages: any[]) => void): () => void {
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

  isNewDay(messages: any): boolean {
    if (messages.length === 0) return true;
    let lastMessage = messages[messages.length - 1];
    let lastMessageDate = lastMessage.date;
    let todayDate = new Date().toISOString().split('T')[0];
    return lastMessageDate !== todayDate;
  }

  isToday(date: any): boolean {
    if (!date) return false;
    let today = new Date().toISOString().split('T')[0];
    let messageDate = new Date(date).toISOString().split('T')[0];

    return today === messageDate;
  }

  formateDate(data: any) {
    return new Date(data).toLocaleDateString('de-DE', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
    });
  }

  buildMessageObject(input: string, messages?: any, reactions?: any): {} {
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
}
