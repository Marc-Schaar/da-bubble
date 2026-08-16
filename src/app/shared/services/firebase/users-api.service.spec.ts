import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApps, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { connectFirestoreEmulator, doc, Firestore, getDoc, getFirestore, provideFirestore, setDoc } from '@angular/fire/firestore';
import { User } from '../../../features/auth/models/user/user';
import { makeUser } from '../../../../testing/user-fixtures';
import { EMULATOR_PROJECT_ID, wipeFirestoreEmulator } from '../../../../testing/firestore-mock.util';
import { UsersApiService } from './users-api.service';

/**
 * Firebase Apps/Firestore instances live in a global (module-level) registry
 * that survives across spec files bundled into the same Karma run, so these
 * helpers reuse an already-initialized app/instance instead of re-initializing
 * (which throws `auth/duplicate-app` / "Firestore has already been started").
 */
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

describe('UsersApiService', () => {
  let service: UsersApiService;
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
      providers: [
        provideFirebaseApp(() => sharedTestApp()),
        provideFirestore(() => sharedTestFirestore()),
        UsersApiService,
      ],
    });
    service = TestBed.inject(UsersApiService);
    firestore = TestBed.inject(Firestore);
  });

  afterEach(async () => {
    activeUnsubs.forEach((unsub) => unsub());
    activeUnsubs.length = 0;
    await wipeFirestoreEmulator();
  });

  describe('createUser', () => {
    it('writes the user document at users/{id} with all fields', async () => {
      const user = makeUser();
      await service.createUser(user);

      const snap = await getDoc(doc(firestore, 'users', user.id));
      expect(snap.exists()).toBeTrue();
      expect(snap.data()?.['email']).toBe(user.email);
      expect(snap.data()?.['displayName']).toBe(user.displayName);
      expect(snap.data()?.['photoUrl']).toBe(user.photoUrl);
      expect(snap.data()?.['online']).toBe(user.online);
    });

    it('stores a redundant "id" field inside the document too (setDoc spreads the whole user object)', async () => {
      // Not a bug: toEntity() always lets the doc id win, so this duplicate
      // field is harmless, but it does mean the raw stored doc is not minimal.
      const user = makeUser();
      await service.createUser(user);

      const snap = await getDoc(doc(firestore, 'users', user.id));
      expect(snap.data()?.['id']).toBe(user.id);
    });

    it('overwrites an existing document at the same id (setDoc, not merge)', async () => {
      const user = makeUser({ displayName: 'Original Name' });
      await service.createUser(user);

      const updated: User = { ...user, displayName: 'New Name' };
      await service.createUser(updated);

      const snap = await getDoc(doc(firestore, 'users', user.id));
      expect(snap.data()?.['displayName']).toBe('New Name');
    });
  });

  describe('updateOnlineStatus', () => {
    it('is a no-op and resolves undefined when currentUser.id is falsy', async () => {
      const result = await service.updateOnlineStatus({ ...makeUser(), id: '' });
      expect(result).toBeUndefined();
    });

    it('updates only the "online" field on an existing document, leaving other fields untouched', async () => {
      const user = makeUser({ online: false, displayName: 'Keep Me' });
      await setDoc(doc(firestore, 'users', user.id), { ...user });

      await service.updateOnlineStatus({ ...user, online: true });

      const snap = await getDoc(doc(firestore, 'users', user.id));
      expect(snap.data()?.['online']).toBeTrue();
      expect(snap.data()?.['displayName']).toBe('Keep Me');
    });

    it('rejects and logs via runWrite when the target document does not exist (genuine Firestore failure)', async () => {
      const consoleSpy = spyOn(console, 'error');
      const user = makeUser();

      await expectAsync(service.updateOnlineStatus(user)).toBeRejected();
      expect(consoleSpy).toHaveBeenCalledWith('Fehler beim Aktualisieren des Online-Status:', jasmine.anything());
    });
  });

  describe('updateUser', () => {
    it('merges a partial update into an existing document', async () => {
      const user = makeUser({ displayName: 'Old', photoUrl: 'old.png' });
      await setDoc(doc(firestore, 'users', user.id), { ...user });

      await service.updateUser(user.id, { displayName: 'New' });

      const snap = await getDoc(doc(firestore, 'users', user.id));
      expect(snap.data()?.['displayName']).toBe('New');
      expect(snap.data()?.['photoUrl']).toBe('old.png');
    });

    it('rejects and logs via runWrite when the target document does not exist (genuine Firestore failure)', async () => {
      const consoleSpy = spyOn(console, 'error');

      await expectAsync(service.updateUser('does-not-exist', { displayName: 'X' })).toBeRejected();
      expect(consoleSpy).toHaveBeenCalledWith('Fehler beim Aktualisieren des Nutzers:', jasmine.anything());
    });
  });

  describe('subUserDoc', () => {
    it('fires the callback with a toEntity-shaped user (id comes from the doc id) when the doc exists', (done) => {
      const user = makeUser();
      setDoc(doc(firestore, 'users', user.id), { ...user }).then(() => {
        const unsub = service.subUserDoc(user.id, (received) => {
          expect(received).not.toBeNull();
          expect(received?.id).toBe(user.id);
          expect(received?.displayName).toBe(user.displayName);
          unsub();
          done();
        });
        activeUnsubs.push(unsub);
      });
    });

    it('fires the callback with null when the doc does not exist', (done) => {
      const unsub = service.subUserDoc('missing-user', (received) => {
        expect(received).toBeNull();
        unsub();
        done();
      });
      activeUnsubs.push(unsub);
    });

    it('fires again with updated data when the document changes', (done) => {
      const user = makeUser({ displayName: 'v1' });
      let callCount = 0;

      setDoc(doc(firestore, 'users', user.id), { ...user }).then(() => {
        const unsub = service.subUserDoc(user.id, (received) => {
          callCount += 1;
          if (callCount === 1) {
            expect(received?.displayName).toBe('v1');
            setDoc(doc(firestore, 'users', user.id), { ...user, displayName: 'v2' });
          } else if (callCount === 2) {
            expect(received?.displayName).toBe('v2');
            unsub();
            done();
          }
        });
        activeUnsubs.push(unsub);
      });
    });
  });

  describe('subAllUsers', () => {
    it('populates the allUsers signal with toEntity-shaped users (id from doc id)', (done) => {
      const user = makeUser();
      setDoc(doc(firestore, 'users', user.id), { ...user }).then(() => {
        service.subAllUsers();

        const check = () => {
          const all = service.allUsers();
          const found = all.find((u) => u.id === user.id);
          if (found) {
            expect(found.displayName).toBe(user.displayName);
            done();
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });
    });

    it('is idempotent: calling it a second time does not throw and the signal keeps working', (done) => {
      service.subAllUsers();
      expect(() => service.subAllUsers()).not.toThrow();

      const user = makeUser();
      setDoc(doc(firestore, 'users', user.id), { ...user }).then(() => {
        const check = () => {
          const found = service.allUsers().find((u) => u.id === user.id);
          if (found) {
            done();
          } else {
            setTimeout(check, 50);
          }
        };
        check();
      });
    });
  });
});
