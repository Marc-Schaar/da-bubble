import { TestBed } from '@angular/core/testing';
import { QuerySnapshot } from '@angular/fire/firestore';
import { MessagesService } from './messages.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { makeUser } from '../../../../../testing/user-fixtures';
import { ChannelMessage } from '../../models/channel-message/channel-message';
import { DirectMessage } from '../../models/direct-message/direct-message';
import { User } from '../../../auth/models/user/user';
import { getConversationId } from '../../../../shared/utils/conversation-id.util';

describe('MessagesService', () => {
  let service: MessagesService;
  let fireServiceSpy: jasmine.SpyObj<FireServiceService>;
  let currentUserSignal: ReturnType<typeof mockSignal<User | null>>;

  beforeEach(() => {
    fireServiceSpy = jasmine.createSpyObj<FireServiceService>('FireServiceService', [
      'getMessagesCollectionRef',
      'getThreadCollectionRef',
      'getMessageRef',
      'getConversationMessagesCollectionRef',
      'getMessageRefForContext',
      'updateMessage',
      'postChannelMessage',
      'postDirectMessage',
      'postThreadMessage',
    ]);

    currentUserSignal = mockSignal<User | null>(null);
    const authServiceMock = { currentUser: currentUserSignal } as unknown as AuthService;

    TestBed.configureTestingModule({
      providers: [
        { provide: FireServiceService, useValue: fireServiceSpy },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
    service = TestBed.inject(MessagesService);
  });

  describe('processData() [pure]', () => {
    function fakeSnapshot(docs: { id: string; data: any }[]): QuerySnapshot {
      return { docs: docs.map((d) => ({ id: d.id, data: () => d.data })) } as unknown as QuerySnapshot;
    }

    it('builds a ChannelMessage for docs with a "reaction" field, using the doc id', () => {
      const snap = fakeSnapshot([{ id: 'm1', data: { message: 'hi', name: 'A', photoUrl: 'p', reaction: [], thread: [] } }]);

      const result = service.processData(snap);

      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(ChannelMessage);
      expect(result[0].id).toBe('m1');
      expect(result[0].message).toBe('hi');
    });

    it('builds a DirectMessage for docs without a "reaction" field', () => {
      const snap = fakeSnapshot([{ id: 'd1', data: { message: 'hey', name: 'A', photoUrl: 'p', from: 'u1', to: 'u2' } }]);

      const result = service.processData(snap);

      expect(result.length).toBe(1);
      expect(result[0]).toBeInstanceOf(DirectMessage);
      expect(result[0].id).toBe('d1');
      expect((result[0] as DirectMessage).from).toBe('u1');
      expect((result[0] as DirectMessage).to).toBe('u2');
    });

    it('overrides any "id" present in the raw data with the doc id', () => {
      const snap = fakeSnapshot([{ id: 'real-id', data: { id: 'stale-id', message: 'x', reaction: [] } }]);
      const result = service.processData(snap);
      expect(result[0].id).toBe('real-id');
    });

    it('processes a mix of channel and direct messages in document order', () => {
      const snap = fakeSnapshot([
        { id: 'm1', data: { message: 'chan', reaction: [] } },
        { id: 'd1', data: { message: 'dm', from: 'u1', to: 'u2' } },
      ]);

      const result = service.processData(snap);

      expect(result[0]).toBeInstanceOf(ChannelMessage);
      expect(result[1]).toBeInstanceOf(DirectMessage);
    });

    it('returns an empty array for an empty snapshot', () => {
      const snap = fakeSnapshot([]);
      expect(service.processData(snap)).toEqual([]);
    });
  });

  describe('subToMessages()', () => {
    it('returns a no-op unsubscribe and does not touch fireService when channelId is null', () => {
      const unsub = service.subToMessages(null);
      unsub();
      expect(fireServiceSpy.getMessagesCollectionRef).not.toHaveBeenCalled();
    });

    it('returns a no-op unsubscribe when getMessagesCollectionRef resolves to null', () => {
      fireServiceSpy.getMessagesCollectionRef.and.returnValue(null);
      const unsub = service.subToMessages('chan-1');
      expect(fireServiceSpy.getMessagesCollectionRef).toHaveBeenCalledWith('chan-1');
      expect(() => unsub()).not.toThrow();
    });
  });

  describe('subToThreadMessages()', () => {
    it('returns a no-op unsubscribe when getThreadCollectionRef resolves to null', () => {
      fireServiceSpy.getThreadCollectionRef.and.returnValue(null);
      const unsub = service.subToThreadMessages('chan-1', 'parent-1');
      expect(fireServiceSpy.getThreadCollectionRef).toHaveBeenCalledWith('chan-1', 'parent-1');
      expect(() => unsub()).not.toThrow();
    });
  });

  describe('subToConversationMessages()', () => {
    it('returns a no-op unsubscribe and does not look up a ref when there is no current user', () => {
      currentUserSignal.set(null);
      const unsub = service.subToConversationMessages('userA', 'userB');
      expect(fireServiceSpy.getConversationMessagesCollectionRef).not.toHaveBeenCalled();
      expect(() => unsub()).not.toThrow();
    });

    it('resolves the conversationId via the sorted user-id pair, independent of call order', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      fireServiceSpy.getConversationMessagesCollectionRef.and.returnValue(null);

      service.subToConversationMessages('userA', 'userB');
      const idForward = fireServiceSpy.getConversationMessagesCollectionRef.calls.mostRecent().args[1];

      fireServiceSpy.getConversationMessagesCollectionRef.calls.reset();
      service.subToConversationMessages('userB', 'userA');
      const idBackward = fireServiceSpy.getConversationMessagesCollectionRef.calls.mostRecent().args[1];

      expect(idForward).toBe(idBackward);
      expect(idForward).toBe(getConversationId('userA', 'userB'));
    });

    it('returns a no-op unsubscribe when the resolved collection ref is null', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      fireServiceSpy.getConversationMessagesCollectionRef.and.returnValue(null);

      const unsub = service.subToConversationMessages('userA', 'userB');

      expect(fireServiceSpy.getConversationMessagesCollectionRef).toHaveBeenCalledWith('me', getConversationId('userA', 'userB'));
      expect(() => unsub()).not.toThrow();
    });
  });

  describe('getParentMessage()', () => {
    it('returns null without calling getDoc when the message ref cannot be resolved', async () => {
      fireServiceSpy.getMessageRef.and.returnValue(null);

      const result = await service.getParentMessage('chan-1', 'msg-1');

      expect(fireServiceSpy.getMessageRef).toHaveBeenCalledWith('chan-1', 'msg-1');
      expect(result).toBeNull();
    });
  });

  describe('updateMessageText()', () => {
    it('updates the message when the ref resolves', () => {
      const ref = { id: 'ref' } as any;
      fireServiceSpy.getMessageRefForContext.and.returnValue(ref);

      service.updateMessageText('m1', 'new text', { channelId: 'c1' });

      expect(fireServiceSpy.getMessageRefForContext).toHaveBeenCalledWith('c1', 'm1', undefined, undefined);
      expect(fireServiceSpy.updateMessage).toHaveBeenCalledWith(ref, 'new text');
    });

    it('does nothing when the ref cannot be resolved', () => {
      fireServiceSpy.getMessageRefForContext.and.returnValue(null);

      service.updateMessageText('m1', 'new text', { channelId: 'c1' });

      expect(fireServiceSpy.updateMessage).not.toHaveBeenCalled();
    });

    it('forwards thread context (parentMessageId, isThread) to getMessageRefForContext', () => {
      fireServiceSpy.getMessageRefForContext.and.returnValue(null);

      service.updateMessageText('m1', 'new text', { channelId: 'c1', parentMessageId: 'p1', isThread: true });

      expect(fireServiceSpy.getMessageRefForContext).toHaveBeenCalledWith('c1', 'm1', 'p1', true);
    });
  });

  describe('sendChannelMessage()', () => {
    it('does nothing when there is no current user', async () => {
      currentUserSignal.set(null);
      await service.sendChannelMessage('hi', 'chan-1');
      expect(fireServiceSpy.postChannelMessage).not.toHaveBeenCalled();
    });

    it('posts a ChannelMessage built from the current user and text', async () => {
      const user = makeUser({ id: 'u1', displayName: 'Alice', photoUrl: 'p.png' });
      currentUserSignal.set(user);
      fireServiceSpy.postChannelMessage.and.resolveTo();

      await service.sendChannelMessage('hello there', 'chan-1');

      expect(fireServiceSpy.postChannelMessage).toHaveBeenCalledTimes(1);
      const [channelId, data, senderId] = fireServiceSpy.postChannelMessage.calls.mostRecent().args;
      expect(channelId).toBe('chan-1');
      expect(senderId).toBe('u1');
      expect(data).toEqual(
        jasmine.objectContaining({
          name: 'Alice',
          photoUrl: 'p.png',
          message: 'hello there',
          reaction: [],
        }),
      );
      expect(data.timestamp).toBeDefined();
    });
  });

  describe('sendDirectMessage()', () => {
    it('does nothing when there is no current user', async () => {
      currentUserSignal.set(null);
      await service.sendDirectMessage('hi', 'receiver-1');
      expect(fireServiceSpy.postDirectMessage).not.toHaveBeenCalled();
    });

    it('posts a DirectMessage with the sorted-pair conversationId', async () => {
      const user = makeUser({ id: 'sender', displayName: 'Sender', photoUrl: 'p.png' });
      currentUserSignal.set(user);
      fireServiceSpy.postDirectMessage.and.resolveTo();

      await service.sendDirectMessage('hello', 'receiver-1');

      const [senderId, receiverId, conversationId, data] = fireServiceSpy.postDirectMessage.calls.mostRecent().args;
      expect(senderId).toBe('sender');
      expect(receiverId).toBe('receiver-1');
      expect(conversationId).toBe(getConversationId('sender', 'receiver-1'));
      expect(data).toEqual(
        jasmine.objectContaining({
          message: 'hello',
          name: 'Sender',
          photoUrl: 'p.png',
          from: 'sender',
          to: 'receiver-1',
        }),
      );
    });
  });

  describe('sendThreadMessage()', () => {
    it('does nothing when there is no current user', async () => {
      currentUserSignal.set(null);
      await service.sendThreadMessage('hi', 'chan-1', 'parent-1');
      expect(fireServiceSpy.postThreadMessage).not.toHaveBeenCalled();
    });

    it('posts a ChannelMessage-shaped reply to the thread', async () => {
      const user = makeUser({ id: 'u1', displayName: 'Alice', photoUrl: 'p.png' });
      currentUserSignal.set(user);
      fireServiceSpy.postThreadMessage.and.resolveTo();

      await service.sendThreadMessage('reply text', 'chan-1', 'parent-1');

      const [channelId, parentMessageId, data] = fireServiceSpy.postThreadMessage.calls.mostRecent().args;
      expect(channelId).toBe('chan-1');
      expect(parentMessageId).toBe('parent-1');
      expect(data).toEqual(
        jasmine.objectContaining({
          name: 'Alice',
          photoUrl: 'p.png',
          message: 'reply text',
          reaction: [],
        }),
      );
    });
  });
});
