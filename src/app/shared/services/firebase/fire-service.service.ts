import { inject, Injectable } from '@angular/core';
import { collection, CollectionReference, doc, DocumentReference, Firestore } from '@angular/fire/firestore';
import { Reaction } from '../../../features/chat/models/channel-message/channel-message';
import { User } from '../../../features/auth/models/user/user';
import { ChannelsApiService } from './channels-api.service';
import { MessagesApiService } from './messages-api.service';
import { UsersApiService } from './users-api.service';

/**
 * Fassade über die Firestore-Zugriffsschicht. Bündelt `UsersApiService`,
 * `ChannelsApiService` und `MessagesApiService` unter einer stabilen API,
 * damit Consumer weiterhin nur einen Service injizieren müssen.
 */
@Injectable({
  providedIn: 'root',
})
export class FireServiceService {
  private firestore: Firestore = inject(Firestore);
  private usersApi = inject(UsersApiService);
  private channelsApi = inject(ChannelsApiService);
  private messagesApi = inject(MessagesApiService);

  public get allUsers() {
    return this.usersApi.allUsers;
  }

  public get myChannels() {
    return this.channelsApi.myChannels;
  }

  updateOnlineStatus(currentUser: User) {
    return this.usersApi.updateOnlineStatus(currentUser);
  }

  subAllUsers(): void {
    this.usersApi.subAllUsers();
  }

  subChannels(): void {
    this.channelsApi.subChannels();
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

  getMessageRef(channelId: string, messageId: string): DocumentReference | null {
    return this.messagesApi.getMessageRef(channelId, messageId);
  }

  getMessageThreadRef(channelId: string, messageId: string, threadMessageID: string): DocumentReference | null {
    return this.messagesApi.getMessageThreadRef(channelId, messageId, threadMessageID);
  }

  updateMessage(ref: DocumentReference, value: string) {
    return this.messagesApi.updateMessage(ref, value);
  }

  updateReaction(ref: DocumentReference, value: Reaction[]) {
    return this.messagesApi.updateReaction(ref, value);
  }

  async postChannelMessage(channelId: string, data: any) {
    return this.messagesApi.postChannelMessage(channelId, data);
  }

  public async postDirectMessage(
    senderPath: string,
    receiverPath: string,
    senderId: string | undefined,
    receiverId: string,
    messageData: any,
  ) {
    return this.messagesApi.postDirectMessage(senderPath, receiverPath, senderId, receiverId, messageData);
  }

  public async postThreadMessage(channelId: string, parentMessageId: string, data: any) {
    return this.messagesApi.postThreadMessage(channelId, parentMessageId, data);
  }

  async addChannel(data: any) {
    return this.channelsApi.addChannel(data);
  }

  async updateChannelData(channelId: string, data: Partial<{ name: string; description: string }>) {
    return this.channelsApi.updateChannelData(channelId, data);
  }

  async addChannelMembers(channelId: string, memberObjects: { id: string }[]) {
    return this.channelsApi.addChannelMembers(channelId, memberObjects);
  }

  public async leaveChannel(channelId: string, userId: string) {
    return this.channelsApi.leaveChannel(channelId, userId);
  }

  public async checkChannelNameExists(name: string): Promise<boolean> {
    return this.channelsApi.checkChannelNameExists(name);
  }
}
