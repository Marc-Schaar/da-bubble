import { inject, Injectable } from '@angular/core';
import { CollectionReference, DocumentReference } from '@angular/fire/firestore';
import { Channel } from '../../../features/channel/models/channel/channel';
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

  async createUser(user: User) {
    return this.usersApi.createUser(user);
  }

  async updateUser(userId: string, data: Partial<User>) {
    return this.usersApi.updateUser(userId, data);
  }

  subUserDoc(userId: string, callback: (user: User | null) => void): () => void {
    return this.usersApi.subUserDoc(userId, callback);
  }

  subAllUsers(): void {
    this.usersApi.subAllUsers();
  }

  subChannels(): void {
    this.channelsApi.subChannels();
  }

  subChannelDoc(channelId: string, callback: (channel: Channel | null) => void): () => void {
    return this.channelsApi.subChannelDoc(channelId, callback);
  }

  getMessageRef(channelId: string, messageId: string): DocumentReference | null {
    return this.messagesApi.getMessageRef(channelId, messageId);
  }

  getMessageThreadRef(channelId: string, messageId: string, threadMessageID: string): DocumentReference | null {
    return this.messagesApi.getMessageThreadRef(channelId, messageId, threadMessageID);
  }

  getMessageRefForContext(channelId: string, messageId: string, parentMessageId?: string, isThread?: boolean): DocumentReference | null {
    return this.messagesApi.getMessageRefForContext(channelId, messageId, parentMessageId, isThread);
  }

  getMessagesCollectionRef(channelId: string): CollectionReference | null {
    return this.messagesApi.getMessagesCollectionRef(channelId);
  }

  getThreadCollectionRef(channelId: string, parentMessageId: string): CollectionReference | null {
    return this.messagesApi.getThreadCollectionRef(channelId, parentMessageId);
  }

  getConversationMessagesCollectionRef(userId: string, conversationId: string): CollectionReference | null {
    return this.messagesApi.getConversationMessagesCollectionRef(userId, conversationId);
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

  public async postDirectMessage(senderId: string, receiverId: string, conversationId: string, messageData: any) {
    return this.messagesApi.postDirectMessage(senderId, receiverId, conversationId, messageData);
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

  public async findChannelByName(name: string) {
    return this.channelsApi.findChannelByName(name);
  }
}
