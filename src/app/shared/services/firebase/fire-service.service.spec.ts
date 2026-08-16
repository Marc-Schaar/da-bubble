import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { FireServiceService } from './fire-service.service';
import { UsersApiService } from './users-api.service';
import { ChannelsApiService } from './channels-api.service';
import { MessagesApiService } from './messages-api.service';
import { UnreadApiService } from './unread-api.service';
import { makeUser } from '../../../../testing/user-fixtures';
import { makeChannel } from '../../../../testing/channel-fixtures';

/**
 * Pure delegation facade — every public method just forwards to one of the
 * four injected API services. Unlike the other 8 files in this task, this
 * spec deliberately does NOT touch the Firebase emulator: the only thing
 * worth verifying here is that each method calls the right underlying
 * service with the right arguments (and returns/forwards its result), so
 * jasmine spy objects are the right tool, not real Firestore behavior.
 */
describe('FireServiceService', () => {
  let service: FireServiceService;
  let usersApi: jasmine.SpyObj<UsersApiService>;
  let channelsApi: jasmine.SpyObj<ChannelsApiService>;
  let messagesApi: jasmine.SpyObj<MessagesApiService>;
  let unreadApi: jasmine.SpyObj<UnreadApiService>;

  const allUsersSignal = signal([makeUser()]);
  const myChannelsSignal = signal([makeChannel()]);

  beforeEach(() => {
    usersApi = jasmine.createSpyObj<UsersApiService>('UsersApiService', [
      'createUser',
      'updateOnlineStatus',
      'updateUser',
      'subUserDoc',
      'subAllUsers',
    ]);
    (usersApi as any).allUsers = allUsersSignal;

    channelsApi = jasmine.createSpyObj<ChannelsApiService>('ChannelsApiService', [
      'subChannels',
      'subChannelDoc',
      'getChannelOnce',
      'addChannel',
      'updateChannelData',
      'addChannelMembers',
      'leaveChannel',
      'checkChannelNameExists',
      'findChannelByName',
    ]);
    (channelsApi as any).myChannels = myChannelsSignal;

    messagesApi = jasmine.createSpyObj<MessagesApiService>('MessagesApiService', [
      'getMessageRef',
      'getMessageThreadRef',
      'getMessageRefForContext',
      'getMessagesCollectionRef',
      'getThreadCollectionRef',
      'getConversationMessagesCollectionRef',
      'updateMessage',
      'updateReaction',
      'postChannelMessage',
      'postDirectMessage',
      'postThreadMessage',
    ]);

    unreadApi = jasmine.createSpyObj<UnreadApiService>('UnreadApiService', ['subUnreadCounters', 'resetUnread', 'incrementUnread', 'incrementUnreadBatch']);

    TestBed.configureTestingModule({
      providers: [
        FireServiceService,
        { provide: UsersApiService, useValue: usersApi },
        { provide: ChannelsApiService, useValue: channelsApi },
        { provide: MessagesApiService, useValue: messagesApi },
        { provide: UnreadApiService, useValue: unreadApi },
      ],
    });
    service = TestBed.inject(FireServiceService);
  });

  it('allUsers forwards to usersApi.allUsers', () => {
    expect(service.allUsers).toBe(allUsersSignal);
  });

  it('myChannels forwards to channelsApi.myChannels', () => {
    expect(service.myChannels).toBe(myChannelsSignal);
  });

  it('updateOnlineStatus forwards to usersApi.updateOnlineStatus with the given user', () => {
    const user = makeUser();
    usersApi.updateOnlineStatus.and.resolveTo(undefined);
    service.updateOnlineStatus(user);
    expect(usersApi.updateOnlineStatus).toHaveBeenCalledWith(user);
  });

  it('createUser forwards to usersApi.createUser with the given user', async () => {
    const user = makeUser();
    usersApi.createUser.and.resolveTo(undefined);
    await service.createUser(user);
    expect(usersApi.createUser).toHaveBeenCalledWith(user);
  });

  it('updateUser forwards to usersApi.updateUser with userId and data', async () => {
    usersApi.updateUser.and.resolveTo(undefined);
    await service.updateUser('u1', { displayName: 'New' });
    expect(usersApi.updateUser).toHaveBeenCalledWith('u1', { displayName: 'New' });
  });

  it('subUserDoc forwards to usersApi.subUserDoc and returns its unsubscribe function', () => {
    const unsub = jasmine.createSpy('unsub');
    usersApi.subUserDoc.and.returnValue(unsub);
    const callback = () => {};

    const result = service.subUserDoc('u1', callback);

    expect(usersApi.subUserDoc).toHaveBeenCalledWith('u1', callback);
    expect(result).toBe(unsub);
  });

  it('subAllUsers forwards to usersApi.subAllUsers', () => {
    service.subAllUsers();
    expect(usersApi.subAllUsers).toHaveBeenCalled();
  });

  it('subChannels forwards to channelsApi.subChannels', () => {
    service.subChannels();
    expect(channelsApi.subChannels).toHaveBeenCalled();
  });

  it('subChannelDoc forwards to channelsApi.subChannelDoc and returns its unsubscribe function', () => {
    const unsub = jasmine.createSpy('unsub');
    channelsApi.subChannelDoc.and.returnValue(unsub);
    const callback = () => {};

    const result = service.subChannelDoc('c1', callback);

    expect(channelsApi.subChannelDoc).toHaveBeenCalledWith('c1', callback);
    expect(result).toBe(unsub);
  });

  it('getMessageRef forwards to messagesApi.getMessageRef and returns its result', () => {
    const ref = {} as any;
    messagesApi.getMessageRef.and.returnValue(ref);
    const result = service.getMessageRef('c1', 'm1');
    expect(messagesApi.getMessageRef).toHaveBeenCalledWith('c1', 'm1');
    expect(result).toBe(ref);
  });

  it('getMessageThreadRef forwards to messagesApi.getMessageThreadRef', () => {
    const ref = {} as any;
    messagesApi.getMessageThreadRef.and.returnValue(ref);
    const result = service.getMessageThreadRef('c1', 'm1', 't1');
    expect(messagesApi.getMessageThreadRef).toHaveBeenCalledWith('c1', 'm1', 't1');
    expect(result).toBe(ref);
  });

  it('getMessageRefForContext forwards all four arguments to messagesApi.getMessageRefForContext', () => {
    const ref = {} as any;
    messagesApi.getMessageRefForContext.and.returnValue(ref);
    const result = service.getMessageRefForContext('c1', 'm1', 'p1', true);
    expect(messagesApi.getMessageRefForContext).toHaveBeenCalledWith('c1', 'm1', 'p1', true);
    expect(result).toBe(ref);
  });

  it('getMessagesCollectionRef forwards to messagesApi.getMessagesCollectionRef', () => {
    const ref = {} as any;
    messagesApi.getMessagesCollectionRef.and.returnValue(ref);
    const result = service.getMessagesCollectionRef('c1');
    expect(messagesApi.getMessagesCollectionRef).toHaveBeenCalledWith('c1');
    expect(result).toBe(ref);
  });

  it('getThreadCollectionRef forwards to messagesApi.getThreadCollectionRef', () => {
    const ref = {} as any;
    messagesApi.getThreadCollectionRef.and.returnValue(ref);
    const result = service.getThreadCollectionRef('c1', 'p1');
    expect(messagesApi.getThreadCollectionRef).toHaveBeenCalledWith('c1', 'p1');
    expect(result).toBe(ref);
  });

  it('getConversationMessagesCollectionRef forwards to messagesApi.getConversationMessagesCollectionRef', () => {
    const ref = {} as any;
    messagesApi.getConversationMessagesCollectionRef.and.returnValue(ref);
    const result = service.getConversationMessagesCollectionRef('u1', 'conv1');
    expect(messagesApi.getConversationMessagesCollectionRef).toHaveBeenCalledWith('u1', 'conv1');
    expect(result).toBe(ref);
  });

  it('updateMessage forwards to messagesApi.updateMessage', () => {
    const ref = {} as any;
    service.updateMessage(ref, 'new text');
    expect(messagesApi.updateMessage).toHaveBeenCalledWith(ref, 'new text');
  });

  it('updateReaction forwards to messagesApi.updateReaction', () => {
    const ref = {} as any;
    const reactions = [{ emoji: '👍', from: 'u1' }];
    service.updateReaction(ref, reactions);
    expect(messagesApi.updateReaction).toHaveBeenCalledWith(ref, reactions);
  });

  it('postChannelMessage forwards channelId, data and senderId to messagesApi.postChannelMessage', async () => {
    messagesApi.postChannelMessage.and.resolveTo(undefined);
    await service.postChannelMessage('c1', { message: 'hi' }, 'sender1');
    expect(messagesApi.postChannelMessage).toHaveBeenCalledWith('c1', { message: 'hi' }, 'sender1');
  });

  it('subUnreadCounters forwards to unreadApi.subUnreadCounters and returns its unsubscribe function', () => {
    const unsub = jasmine.createSpy('unsub');
    unreadApi.subUnreadCounters.and.returnValue(unsub);
    const callback = () => {};

    const result = service.subUnreadCounters('u1', callback);

    expect(unreadApi.subUnreadCounters).toHaveBeenCalledWith('u1', callback);
    expect(result).toBe(unsub);
  });

  it('resetUnread forwards to unreadApi.resetUnread', async () => {
    unreadApi.resetUnread.and.resolveTo(undefined);
    await service.resetUnread('u1', 'chat1');
    expect(unreadApi.resetUnread).toHaveBeenCalledWith('u1', 'chat1');
  });

  it('postDirectMessage forwards all four arguments to messagesApi.postDirectMessage', async () => {
    messagesApi.postDirectMessage.and.resolveTo(undefined);
    await service.postDirectMessage('sender1', 'receiver1', 'conv1', { message: 'hi' });
    expect(messagesApi.postDirectMessage).toHaveBeenCalledWith('sender1', 'receiver1', 'conv1', { message: 'hi' });
  });

  it('postThreadMessage forwards channelId, parentMessageId and data to messagesApi.postThreadMessage', async () => {
    messagesApi.postThreadMessage.and.resolveTo(undefined);
    await service.postThreadMessage('c1', 'parent1', { message: 'reply' });
    expect(messagesApi.postThreadMessage).toHaveBeenCalledWith('c1', 'parent1', { message: 'reply' });
  });

  it('addChannel forwards to channelsApi.addChannel and returns its result', async () => {
    const ref = {} as any;
    channelsApi.addChannel.and.resolveTo(ref);
    const result = await service.addChannel({ name: 'x' });
    expect(channelsApi.addChannel).toHaveBeenCalledWith({ name: 'x' });
    expect(result).toBe(ref);
  });

  it('updateChannelData forwards to channelsApi.updateChannelData', async () => {
    channelsApi.updateChannelData.and.resolveTo(undefined);
    await service.updateChannelData('c1', { name: 'New' });
    expect(channelsApi.updateChannelData).toHaveBeenCalledWith('c1', { name: 'New' });
  });

  it('addChannelMembers forwards to channelsApi.addChannelMembers', async () => {
    channelsApi.addChannelMembers.and.resolveTo(undefined);
    const members = [{ id: 'u1' }];
    await service.addChannelMembers('c1', members);
    expect(channelsApi.addChannelMembers).toHaveBeenCalledWith('c1', members);
  });

  it('leaveChannel forwards to channelsApi.leaveChannel', async () => {
    channelsApi.leaveChannel.and.resolveTo(undefined);
    await service.leaveChannel('c1', 'u1');
    expect(channelsApi.leaveChannel).toHaveBeenCalledWith('c1', 'u1');
  });

  it('checkChannelNameExists forwards to channelsApi.checkChannelNameExists and returns its result', async () => {
    channelsApi.checkChannelNameExists.and.resolveTo(true);
    const result = await service.checkChannelNameExists('Name');
    expect(channelsApi.checkChannelNameExists).toHaveBeenCalledWith('Name');
    expect(result).toBeTrue();
  });

  it('findChannelByName forwards to channelsApi.findChannelByName and returns its result', async () => {
    const channel = makeChannel();
    channelsApi.findChannelByName.and.resolveTo(channel);
    const result = await service.findChannelByName('Name');
    expect(channelsApi.findChannelByName).toHaveBeenCalledWith('Name');
    expect(result).toBe(channel);
  });
});
