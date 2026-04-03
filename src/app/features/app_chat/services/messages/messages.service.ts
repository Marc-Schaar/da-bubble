import { inject, Injectable, signal } from '@angular/core';
import { onSnapshot, orderBy, query, QuerySnapshot, serverTimestamp } from '@angular/fire/firestore';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
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

  private isChannelMessage(data: ChannelMessage | DirectMessage): boolean {
    return 'reaction' in data;
  }

  public async sendChannelMessage(text: string, channelId: string) {
    const user = this.authService.currentUser();
    if (!user) return;

    const channelMessage = new ChannelMessage({
      message: text,
      name: user.displayName,
      photoUrl: user.photoUrl,
    });

    await this.fireService.postChannelMessage(channelId, channelMessage.toJSON());
  }

  public async sendDirectMessage(text: string, receiverId: string) {
    const user = this.authService.currentUser();
    const currentUserId = user?.id;
    if (!currentUserId) return;

    const messageInstance = new DirectMessage({
      message: text,
      from: currentUserId,
      to: receiverId,
      name: user?.displayName,
      photoUrl: user?.photoUrl,
    });

    const [uid1, uid2] = [currentUserId, receiverId].sort();
    const conversationId = `${uid1}_${uid2}`;

    const senderPath = `users/${currentUserId}/conversations/${conversationId}/messages`;
    const receiverPath = `users/${receiverId}/conversations/${conversationId}/messages`;

    await this.fireService.postDirectMessage(senderPath, receiverPath, currentUserId, receiverId, messageInstance.toJSON());
  }

  public async sendThreadMessage(text: string, channelId: string, parentMessageId: string) {
    const user = this.authService.currentUser();
    if (!user) return;

    const threadMessage = new ChannelMessage({
      message: text,
      name: user.displayName,
      photoUrl: user.photoUrl,
    });

    await this.fireService.postThreadMessage(channelId, parentMessageId, threadMessage.toJSON());
  }
}
