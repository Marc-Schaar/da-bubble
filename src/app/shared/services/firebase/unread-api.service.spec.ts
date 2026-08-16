import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApps, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectFirestoreEmulator, doc, Firestore, getDoc, getFirestore, provideFirestore, setDoc } from '@angular/fire/firestore';
import { EMULATOR_PROJECT_ID, wipeFirestoreEmulator } from '../../../../testing/firestore-mock.util';
import { UnreadApiService } from './unread-api.service';

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

describe('UnreadApiService', () => {
  let service: UnreadApiService;
  let firestore: Firestore;
  const activeUnsubs: (() => void)[] = [];

  beforeAll(() => {
    // The first onSnapshot()/getDoc() round trip of a fresh browser session
    // can take a few seconds while the Firestore emulator's WebChannel
    // connection warms up, which occasionally exceeds Jasmine's 5s default.
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideFirebaseApp(() => sharedTestApp()), provideFirestore(() => sharedTestFirestore()), UnreadApiService],
    });
    service = TestBed.inject(UnreadApiService);
    firestore = TestBed.inject(Firestore);
  });

  afterEach(async () => {
    activeUnsubs.forEach((unsub) => unsub());
    activeUnsubs.length = 0;
    await wipeFirestoreEmulator();
  });

  describe('ref-building methods', () => {
    it('getUnreadCounterRef returns a ref at users/{userId}/unreadCounters/{chatId}', () => {
      expect(service.getUnreadCounterRef('u1', 'chat1')?.path).toBe('users/u1/unreadCounters/chat1');
    });

    it('getUnreadCounterRef returns null when userId or chatId is falsy', () => {
      expect(service.getUnreadCounterRef('', 'chat1')).toBeNull();
      expect(service.getUnreadCounterRef('u1', '')).toBeNull();
    });

    it('getUnreadCountersCollectionRef returns a ref at users/{userId}/unreadCounters', () => {
      expect(service.getUnreadCountersCollectionRef('u1')?.path).toBe('users/u1/unreadCounters');
    });

    it('getUnreadCountersCollectionRef returns null when userId is falsy', () => {
      expect(service.getUnreadCountersCollectionRef('')).toBeNull();
    });
  });

  describe('subUnreadCounters', () => {
    it('fires the callback with toEntity-shaped counters (id from doc id)', (done) => {
      setDoc(doc(firestore, 'users/u-sub/unreadCounters/chat1'), { type: 'channel', unreadCount: 3 }).then(() => {
        const unsub = service.subUnreadCounters('u-sub', (counters) => {
          const found = counters.find((c) => c.id === 'chat1');
          if (found) {
            expect(found.unreadCount).toBe(3);
            expect(found.type).toBe('channel');
            unsub();
            done();
          }
        });
        activeUnsubs.push(unsub);
      });
    });

    it('returns a no-op unsubscribe function and never calls back when userId is falsy', (done) => {
      const callback = jasmine.createSpy('callback');
      const unsub = service.subUnreadCounters('', callback);
      expect(unsub).toEqual(jasmine.any(Function));
      expect(() => unsub()).not.toThrow();

      setTimeout(() => {
        expect(callback).not.toHaveBeenCalled();
        done();
      }, 300);
    });
  });

  describe('incrementUnread', () => {
    it('creates the counter doc at unreadCount=1 when it does not yet exist (merge: true)', async () => {
      await service.incrementUnread('u1', 'chat1', 'direct');

      const snap = await getDoc(doc(firestore, 'users/u1/unreadCounters/chat1'));
      expect(snap.data()?.['unreadCount']).toBe(1);
      expect(snap.data()?.['type']).toBe('direct');
    });

    it('increments an existing counter rather than overwriting it', async () => {
      await setDoc(doc(firestore, 'users/u2/unreadCounters/chat1'), { type: 'direct', unreadCount: 5 });
      await service.incrementUnread('u2', 'chat1', 'direct');

      const snap = await getDoc(doc(firestore, 'users/u2/unreadCounters/chat1'));
      expect(snap.data()?.['unreadCount']).toBe(6);
    });

    it('resolves undefined without writing anything when the ref is null (userId falsy)', async () => {
      const result = await service.incrementUnread('', 'chat1', 'direct');
      expect(result).toBeUndefined();
    });
  });

  describe('incrementUnreadBatch', () => {
    it('increments the same chat counter for every unique userId in a single batch', async () => {
      await service.incrementUnreadBatch(['u1', 'u2', 'u3'], 'chan1', 'channel');

      const snap1 = await getDoc(doc(firestore, 'users/u1/unreadCounters/chan1'));
      const snap2 = await getDoc(doc(firestore, 'users/u2/unreadCounters/chan1'));
      const snap3 = await getDoc(doc(firestore, 'users/u3/unreadCounters/chan1'));
      expect(snap1.data()?.['unreadCount']).toBe(1);
      expect(snap2.data()?.['unreadCount']).toBe(1);
      expect(snap3.data()?.['unreadCount']).toBe(1);
    });

    it('dedups a userId that appears twice in the input so it is only incremented once', async () => {
      await service.incrementUnreadBatch(['dup-user', 'dup-user', 'other-user'], 'chan1', 'channel');

      const dupSnap = await getDoc(doc(firestore, 'users/dup-user/unreadCounters/chan1'));
      expect(dupSnap.data()?.['unreadCount']).toBe(1);
    });

    it('filters out falsy userIds before writing', async () => {
      await service.incrementUnreadBatch(['', 'real-user', undefined as unknown as string], 'chan1', 'channel');

      const snap = await getDoc(doc(firestore, 'users/real-user/unreadCounters/chan1'));
      expect(snap.data()?.['unreadCount']).toBe(1);
    });

    it('is a no-op and resolves undefined when the userIds array is empty', async () => {
      const result = await service.incrementUnreadBatch([], 'chan1', 'channel');
      expect(result).toBeUndefined();
    });

    it('is a no-op and resolves undefined when every userId is falsy', async () => {
      const result = await service.incrementUnreadBatch(['', undefined as unknown as string], 'chan1', 'channel');
      expect(result).toBeUndefined();
    });

    it('bumps an existing counter for each recipient rather than overwriting it', async () => {
      await setDoc(doc(firestore, 'users/existing-u/unreadCounters/chan2'), { type: 'channel', unreadCount: 2 });
      await service.incrementUnreadBatch(['existing-u'], 'chan2', 'channel');

      const snap = await getDoc(doc(firestore, 'users/existing-u/unreadCounters/chan2'));
      expect(snap.data()?.['unreadCount']).toBe(3);
    });
  });

  describe('resetUnread', () => {
    it('sets unreadCount to 0 on an existing counter', async () => {
      await setDoc(doc(firestore, 'users/u1/unreadCounters/chat1'), { type: 'direct', unreadCount: 7 });
      await service.resetUnread('u1', 'chat1');

      const snap = await getDoc(doc(firestore, 'users/u1/unreadCounters/chat1'));
      expect(snap.data()?.['unreadCount']).toBe(0);
    });

    it('creates the counter doc at unreadCount=0 when it does not yet exist (merge: true)', async () => {
      await service.resetUnread('u1', 'brand-new-chat');

      const snap = await getDoc(doc(firestore, 'users/u1/unreadCounters/brand-new-chat'));
      expect(snap.exists()).toBeTrue();
      expect(snap.data()?.['unreadCount']).toBe(0);
    });

    it('resolves undefined without writing anything when the ref is null (chatId falsy)', async () => {
      const result = await service.resetUnread('u1', '');
      expect(result).toBeUndefined();
    });
  });
});
