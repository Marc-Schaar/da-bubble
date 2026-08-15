import { inject, Injectable } from '@angular/core';
import { CollectionReference, DocumentReference } from '@angular/fire/firestore';
import { Channel } from '../../../features/channel/models/channel/channel';
import { Reaction } from '../../../features/chat/models/channel-message/channel-message';
import { User } from '../../../features/auth/models/user/user';
import { ChannelsApiService } from './channels-api.service';
import { MessagesApiService } from './messages-api.service';
import { UsersApiService } from './users-api.service';
import { UnreadApiService } from './unread-api.service';
import { UnreadCounter } from '../../models/unread-counter/unread-counter';

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
  private unreadApi = inject(UnreadApiService);

  public get allUsers() {
    return this.usersApi.allUsers;
  }

  public get myChannels() {
    return this.channelsApi.myChannels;
  }

  public updateOnlineStatus(currentUser: User) {
    return this.usersApi.updateOnlineStatus(currentUser);
  }

  public async createUser(user: User) {
    return this.usersApi.createUser(user);
  }

  public async updateUser(userId: string, data: Partial<User>) {
    return this.usersApi.updateUser(userId, data);
  }

  public subUserDoc(userId: string, callback: (user: User | null) => void): () => void {
    return this.usersApi.subUserDoc(userId, callback);
  }

  public subAllUsers(): void {
    this.usersApi.subAllUsers();
  }

  public subChannels(): void {
    this.channelsApi.subChannels();
  }

  public subChannelDoc(channelId: string, callback: (channel: Channel | null) => void): () => void {
    return this.channelsApi.subChannelDoc(channelId, callback);
  }

  public getMessageRef(channelId: string, messageId: string): DocumentReference | null {
    return this.messagesApi.getMessageRef(channelId, messageId);
  }

  public getMessageThreadRef(channelId: string, messageId: string, threadMessageID: string): DocumentReference | null {
    return this.messagesApi.getMessageThreadRef(channelId, messageId, threadMessageID);
  }

  public getMessageRefForContext(channelId: string, messageId: string, parentMessageId?: string, isThread?: boolean): DocumentReference | null {
    return this.messagesApi.getMessageRefForContext(channelId, messageId, parentMessageId, isThread);
  }

  public getMessagesCollectionRef(channelId: string): CollectionReference | null {
    return this.messagesApi.getMessagesCollectionRef(channelId);
  }

  public getThreadCollectionRef(channelId: string, parentMessageId: string): CollectionReference | null {
    return this.messagesApi.getThreadCollectionRef(channelId, parentMessageId);
  }

  public getConversationMessagesCollectionRef(userId: string, conversationId: string): CollectionReference | null {
    return this.messagesApi.getConversationMessagesCollectionRef(userId, conversationId);
  }

  public updateMessage(ref: DocumentReference, value: string) {
    return this.messagesApi.updateMessage(ref, value);
  }

  public updateReaction(ref: DocumentReference, value: Reaction[]) {
    return this.messagesApi.updateReaction(ref, value);
  }

  public async postChannelMessage(channelId: string, data: any, senderId: string) {
    return this.messagesApi.postChannelMessage(channelId, data, senderId);
  }

  public subUnreadCounters(userId: string, callback: (counters: UnreadCounter[]) => void): () => void {
    return this.unreadApi.subUnreadCounters(userId, callback);
  }

  public async resetUnread(userId: string, chatId: string) {
    return this.unreadApi.resetUnread(userId, chatId);
  }

  public async postDirectMessage(senderId: string, receiverId: string, conversationId: string, messageData: any) {
    return this.messagesApi.postDirectMessage(senderId, receiverId, conversationId, messageData);
  }

  public async postThreadMessage(channelId: string, parentMessageId: string, data: any) {
    return this.messagesApi.postThreadMessage(channelId, parentMessageId, data);
  }

  public async addChannel(data: any) {
    return this.channelsApi.addChannel(data);
  }

  public async updateChannelData(channelId: string, data: Partial<{ name: string; description: string }>) {
    return this.channelsApi.updateChannelData(channelId, data);
  }

  public async addChannelMembers(channelId: string, memberObjects: { id: string }[]) {
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
