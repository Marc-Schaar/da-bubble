import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApps, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {
  collection,
  connectFirestoreEmulator,
  doc,
  Firestore,
  getDoc,
  getDocs,
  getFirestore,
  provideFirestore,
  setDoc,
} from '@angular/fire/firestore';
import { Channel } from '../../../features/channel/models/channel/channel';
import { makeUser } from '../../../../testing/user-fixtures';
import { EMULATOR_PROJECT_ID, wipeFirestoreEmulator } from '../../../../testing/firestore-mock.util';
import { ChannelsApiService } from './channels-api.service';
import { UnreadApiService } from './unread-api.service';
import { UserStore } from '../user/user-store';
import { MessagesApiService } from './messages-api.service';

function sharedTestApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length) return existing[0];
  return initializeApp({ projectId: EMULATOR_PROJECT_ID, apiKey: 'demo-api-key', authDomain: 'localhost' });
}

function sharedTestFirestore(): Firestore {
  const firestore = getFirestore(sharedTestApp());
  try {
    connectFirestoreEmulator(firestore, 'localhost', 8080);
  } catch {
    // already connected by an earlier spec file in this browser session
  }
  return firestore;
}

async function seedChannel(firestore: Firestore, overrides: Partial<Channel> & { id: string }): Promise<void> {
  const { id, ...data } = overrides;
  await setDoc(doc(firestore, 'channels', id), { name: `c-${id}`, description: '', member: [], createdAt: new Date(), createdBy: 'x', ...data });
}

describe('MessagesApiService', () => {
  let service: MessagesApiService;
  let unreadApi: UnreadApiService;
  let firestore: Firestore;

  beforeAll(() => {
    // The first onSnapshot()/getDoc() round trip of a fresh browser session
    // can take a few seconds while the Firestore emulator's WebChannel
    // connection warms up, which occasionally exceeds Jasmine's 5s default.
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideFirebaseApp(() => sharedTestApp()),
        provideFirestore(() => sharedTestFirestore()),
        MessagesApiService,
        ChannelsApiService,
        UnreadApiService,
        UserStore,
      ],
    });
    service = TestBed.inject(MessagesApiService);
    unreadApi = TestBed.inject(UnreadApiService);
    firestore = TestBed.inject(Firestore);
  });

  afterEach(async () => {
    await wipeFirestoreEmulator();
  });

  describe('ref-building methods', () => {
    it('getMessageRef returns a ref at channels/{channelId}/messages/{messageId} when both ids are given', () => {
      const ref = service.getMessageRef('chan1', 'msg1');
      expect(ref?.path).toBe('channels/chan1/messages/msg1');
    });

    it('getMessageRef returns null when channelId is falsy', () => {
      expect(service.getMessageRef('', 'msg1')).toBeNull();
    });

    it('getMessageRef returns null when messageId is falsy', () => {
      expect(service.getMessageRef('chan1', '')).toBeNull();
    });

    it('getMessageThreadRef returns a ref at .../messages/{messageId}/thread/{threadMessageID}', () => {
      const ref = service.getMessageThreadRef('chan1', 'msg1', 'reply1');
      expect(ref?.path).toBe('channels/chan1/messages/msg1/thread/reply1');
    });

    it('getMessageThreadRef returns null when any id is falsy', () => {
      expect(service.getMessageThreadRef('', 'msg1', 'reply1')).toBeNull();
      expect(service.getMessageThreadRef('chan1', '', 'reply1')).toBeNull();
      expect(service.getMessageThreadRef('chan1', 'msg1', '')).toBeNull();
    });

    it('getMessageRefForContext resolves to the thread ref when isThread and parentMessageId are given', () => {
      const ref = service.getMessageRefForContext('chan1', 'reply1', 'parent1', true);
      // note the argument re-mapping: parentMessageId becomes the message id,
      // and the outer messageId becomes the thread message id
      expect(ref?.path).toBe('channels/chan1/messages/parent1/thread/reply1');
    });

    it('getMessageRefForContext resolves to the plain message ref when isThread is false', () => {
      const ref = service.getMessageRefForContext('chan1', 'msg1', 'parent1', false);
      expect(ref?.path).toBe('channels/chan1/messages/msg1');
    });

    it('getMessageRefForContext resolves to the plain message ref when isThread is true but parentMessageId is missing', () => {
      const ref = service.getMessageRefForContext('chan1', 'msg1', undefined, true);
      expect(ref?.path).toBe('channels/chan1/messages/msg1');
    });

    it('getMessagesCollectionRef returns a ref at channels/{channelId}/messages, or null when channelId is falsy', () => {
      expect(service.getMessagesCollectionRef('chan1')?.path).toBe('channels/chan1/messages');
      expect(service.getMessagesCollectionRef('')).toBeNull();
    });

    it('getThreadCollectionRef returns a ref at .../messages/{parentMessageId}/thread, or null when any id is falsy', () => {
      expect(service.getThreadCollectionRef('chan1', 'msg1')?.path).toBe('channels/chan1/messages/msg1/thread');
      expect(service.getThreadCollectionRef('', 'msg1')).toBeNull();
      expect(service.getThreadCollectionRef('chan1', '')).toBeNull();
    });

    it('getConversationMessagesCollectionRef returns a ref at users/{userId}/conversations/{conversationId}/messages, or null when any id is falsy', () => {
      expect(service.getConversationMessagesCollectionRef('u1', 'conv1')?.path).toBe('users/u1/conversations/conv1/messages');
      expect(service.getConversationMessagesCollectionRef('', 'conv1')).toBeNull();
      expect(service.getConversationMessagesCollectionRef('u1', '')).toBeNull();
    });
  });

  describe('updateMessage', () => {
    it('updates the "message" field on the referenced doc', async () => {
      const ref = doc(firestore, 'channels/chan1/messages/msg1');
      await setDoc(ref, { message: 'old', name: 'x', photoUrl: '', timestamp: null, reaction: [] });

      await service.updateMessage(ref, 'new text');

      const snap = await getDoc(ref);
      expect(snap.data()?.['message']).toBe('new text');
    });

    it('returns null (not a promise) synchronously when ref is falsy', () => {
      expect(service.updateMessage(null as any, 'x')).toBeNull();
    });

    it('rejects and logs via runWrite when the target document does not exist (genuine Firestore failure)', async () => {
      const consoleSpy = spyOn(console, 'error');
      const ref = doc(firestore, 'channels/chan1/messages/does-not-exist');
      await expectAsync(service.updateMessage(ref, 'x')).toBeRejected();
      expect(consoleSpy).toHaveBeenCalledWith('Fehler beim Aktualisieren der Nachricht:', jasmine.anything());
    });
  });

  describe('updateReaction', () => {
    it('updates the "reaction" field on the referenced doc', async () => {
      const ref = doc(firestore, 'channels/chan1/messages/msg2');
      await setDoc(ref, { message: 'x', name: 'x', photoUrl: '', timestamp: null, reaction: [] });

      const reactions = [{ emoji: '👍', from: 'u1' }];
      await service.updateReaction(ref, reactions);

      const snap = await getDoc(ref);
      expect(snap.data()?.['reaction']).toEqual(reactions);
    });

    it('returns null (not a promise) synchronously when ref is falsy', () => {
      expect(service.updateReaction(null as any, [])).toBeNull();
    });
  });

  describe('postChannelMessage', () => {
    it('creates the message doc, merges in ChannelMessage.toJSON() fields, and increments unread for other members (excluding the sender)', async () => {
      const sender = makeUser();
      const recipient = makeUser();
      await seedChannel(firestore, { id: 'chan-post', member: [{ id: sender.id }, { id: recipient.id }] });

      await service.postChannelMessage('chan-post', { message: 'hi there', name: sender.displayName, photoUrl: sender.photoUrl }, sender.id);

      const messagesSnap = await getDocs(collection(firestore, 'channels/chan-post/messages'));
      expect(messagesSnap.docs.length).toBe(1);
      const messageData = messagesSnap.docs[0].data();
      expect(messageData['message']).toBe('hi there');
      expect(messageData['reaction']).toEqual([]);

      const recipientCounterSnap = await getDoc(doc(firestore, `users/${recipient.id}/unreadCounters/chan-post`));
      expect(recipientCounterSnap.data()?.['unreadCount']).toBe(1);

      const senderCounterSnap = await getDoc(doc(firestore, `users/${sender.id}/unreadCounters/chan-post`));
      expect(senderCounterSnap.exists()).toBeFalse();
    });

    it('does not throw when the channel has no other members (empty recipient list is a no-op in incrementUnreadBatch)', async () => {
      const sender = makeUser();
      await seedChannel(firestore, { id: 'chan-solo', member: [{ id: sender.id }] });

      await expectAsync(service.postChannelMessage('chan-solo', { message: 'solo' }, sender.id)).toBeResolved();
    });

    it('does not throw when the channel does not exist (getChannelOnce resolves null -> empty recipient list)', async () => {
      await expectAsync(service.postChannelMessage('no-such-channel', { message: 'x' }, 'sender-1')).toBeResolved();

      const messagesSnap = await getDocs(collection(firestore, 'channels/no-such-channel/messages'));
      expect(messagesSnap.docs.length).toBe(1);
    });
  });

  describe('postDirectMessage', () => {
    it('writes the message into both the sender and the receiver conversation subcollections and increments the receiver unread counter', async () => {
      const sender = makeUser();
      const receiver = makeUser();

      await service.postDirectMessage(sender.id, receiver.id, 'conv-1', { message: 'hey' });

      const senderMsgs = await getDocs(collection(firestore, `users/${sender.id}/conversations/conv-1/messages`));
      const receiverMsgs = await getDocs(collection(firestore, `users/${receiver.id}/conversations/conv-1/messages`));
      expect(senderMsgs.docs.length).toBe(1);
      expect(receiverMsgs.docs.length).toBe(1);

      const counterSnap = await getDoc(doc(firestore, `users/${receiver.id}/unreadCounters/conv-1`));
      expect(counterSnap.data()?.['unreadCount']).toBe(1);
    });

    it('writes only once and does not increment unread when messaging yourself (senderId === receiverId)', async () => {
      const self = makeUser();

      await service.postDirectMessage(self.id, self.id, 'conv-self', { message: 'note to self' });

      const msgs = await getDocs(collection(firestore, `users/${self.id}/conversations/conv-self/messages`));
      expect(msgs.docs.length).toBe(1);

      const counterSnap = await getDoc(doc(firestore, `users/${self.id}/unreadCounters/conv-self`));
      expect(counterSnap.exists()).toBeFalse();
    });

    it('resolves undefined without writing anything when senderId is falsy (senderRef is null)', async () => {
      const result = await service.postDirectMessage('', 'receiver-1', 'conv-x', { message: 'x' });
      expect(result).toBeUndefined();
    });

    it('resolves undefined without writing anything when conversationId is falsy (both refs null)', async () => {
      const result = await service.postDirectMessage('sender-1', 'receiver-1', '', { message: 'x' });
      expect(result).toBeUndefined();
    });
  });

  describe('postThreadMessage', () => {
    it('adds a doc to the thread subcollection and appends a {time} entry to the parent message thread array', async () => {
      const parentRef = doc(firestore, 'channels/chan-thread/messages/parent-msg');
      await setDoc(parentRef, { message: 'parent', name: 'x', photoUrl: '', timestamp: null, reaction: [], thread: [] });

      await service.postThreadMessage('chan-thread', 'parent-msg', { message: 'a reply' });

      const threadSnap = await getDocs(collection(firestore, 'channels/chan-thread/messages/parent-msg/thread'));
      expect(threadSnap.docs.length).toBe(1);
      expect(threadSnap.docs[0].data()['message']).toBe('a reply');

      const parentSnap = await getDoc(parentRef);
      const thread = parentSnap.data()?.['thread'] as { time: string }[];
      expect(thread.length).toBe(1);
      expect(thread[0].time).toMatch(/^\d{2}:\d{2}$/);
    });

    it('resolves undefined without writing anything when channelId is falsy (threadRef is null)', async () => {
      const result = await service.postThreadMessage('', 'parent-msg', { message: 'x' });
      expect(result).toBeUndefined();
    });

    it('resolves undefined without writing anything when parentMessageId is falsy (both refs null)', async () => {
      const result = await service.postThreadMessage('chan-thread', '', { message: 'x' });
      expect(result).toBeUndefined();
    });

    it('rejects and logs via runWrite when the parent message document does not exist (genuine Firestore failure)', async () => {
      const consoleSpy = spyOn(console, 'error');
      await expectAsync(service.postThreadMessage('chan-thread', 'missing-parent', { message: 'x' })).toBeRejected();
      expect(consoleSpy).toHaveBeenCalledWith('Fehler beim Senden der Thread-Antwort:', jasmine.anything());
    });
  });
});
