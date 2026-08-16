import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApps, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectFirestoreEmulator, doc, Firestore, getFirestore, provideFirestore, setDoc } from '@angular/fire/firestore';
import { makeUser } from '../../../../testing/user-fixtures';
import { EMULATOR_PROJECT_ID, wipeFirestoreEmulator } from '../../../../testing/firestore-mock.util';
import { UserStore } from './user-store';

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

describe('UserStore', () => {
  let store: UserStore;
  let firestore: Firestore;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  });

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideFirebaseApp(() => sharedTestApp()), provideFirestore(() => sharedTestFirestore()), UserStore],
    });
    store = TestBed.inject(UserStore);
    firestore = TestBed.inject(Firestore);
  });

  afterEach(async () => {
    await wipeFirestoreEmulator();
  });

  describe('currentUser / setCurrentUser', () => {
    it('starts out as null', () => {
      expect(store.currentUser()).toBeNull();
    });

    it('setCurrentUser updates the signal to the given user', () => {
      const user = makeUser();
      store.setCurrentUser(user);
      expect(store.currentUser()).toEqual(user);
    });

    it('setCurrentUser(null) clears the signal back to null', () => {
      store.setCurrentUser(makeUser());
      store.setCurrentUser(null);
      expect(store.currentUser()).toBeNull();
    });

    it('currentUser is a readonly signal (no .set on the exposed reference)', () => {
      expect((store.currentUser as any).set).toBeUndefined();
    });
  });

  describe('getUserById', () => {
    it('returns null when id is falsy, without hitting Firestore', async () => {
      const result = await store.getUserById('');
      expect(result).toBeNull();
    });

    it('returns a toEntity-shaped user (id from doc id) when the doc exists', async () => {
      const user = makeUser();
      await setDoc(doc(firestore, 'users', user.id), { ...user });

      const result = await store.getUserById(user.id);
      expect(result?.id).toBe(user.id);
      expect(result?.displayName).toBe(user.displayName);
    });

    it('returns null when the doc does not exist', async () => {
      const result = await store.getUserById('does-not-exist');
      expect(result).toBeNull();
    });
  });

  describe('findUserByDisplayName', () => {
    it('returns the matching user', async () => {
      const user = makeUser({ displayName: 'UniqueDisplayName' });
      await setDoc(doc(firestore, 'users', user.id), { ...user });

      const result = await store.findUserByDisplayName('UniqueDisplayName');
      expect(result?.id).toBe(user.id);
    });

    it('returns null when no user matches', async () => {
      const result = await store.findUserByDisplayName('No Such Name');
      expect(result).toBeNull();
    });

    it('is an exact, case-sensitive match (no partial matching)', async () => {
      const user = makeUser({ displayName: 'ExactMatch' });
      await setDoc(doc(firestore, 'users', user.id), { ...user });

      const partial = await store.findUserByDisplayName('exactmatch');
      const substring = await store.findUserByDisplayName('Exact');
      expect(partial).toBeNull();
      expect(substring).toBeNull();
    });
  });
});
