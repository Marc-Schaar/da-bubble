import { inject, Injectable } from '@angular/core';
import { Firestore, onSnapshot, orderBy, query } from '@angular/fire/firestore';
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
        const processedMessages = this.userService.processData(snapshot);
        onUpdate(processedMessages);
      });
    }

    return () => {};
  }
}
