import { Injector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApps, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { collection, connectFirestoreEmulator, doc, Firestore, getDoc, getFirestore, provideFirestore, setDoc } from '@angular/fire/firestore';
import { Channel } from '../../../features/channel/models/channel/channel';
import { DEFAULT_CHANNEL_ID, GUEST_EMAIL } from '../../constants';
import { UserStore } from '../user/user-store';
import { makeUser } from '../../../../testing/user-fixtures';
import { EMULATOR_PROJECT_ID, wipeFirestoreEmulator } from '../../../../testing/firestore-mock.util';
import { ChannelsApiService } from './channels-api.service';

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

/** Polls a predicate until it returns truthy (or times out) — used to wait on realtime listener callbacks. */
async function waitFor(predicate: () => boolean, timeoutMs = 8000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor: timed out');
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
}

async function seedChannel(firestore: Firestore, overrides: Partial<Channel> & { id: string }): Promise<void> {
  const { id, ...data } = overrides;
  await setDoc(doc(firestore, 'channels', id), { name: `c-${id}`, description: '', member: [], createdAt: new Date(), createdBy: 'x', ...data });
}

describe('ChannelsApiService', () => {
  let service: ChannelsApiService;
  let userStore: UserStore;
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
      providers: [provideFirebaseApp(() => sharedTestApp()), provideFirestore(() => sharedTestFirestore()), ChannelsApiService, UserStore],
    });
    service = TestBed.inject(ChannelsApiService);
    userStore = TestBed.inject(UserStore);
    firestore = TestBed.inject(Firestore);
  });

  afterEach(async () => {
    activeUnsubs.forEach((unsub) => unsub());
    activeUnsubs.length = 0;
    await wipeFirestoreEmulator();
  });

  describe('subChannels / myChannels', () => {
    // subChannels() has no public teardown (it's designed to live for the app's
    // lifetime — see the production code's own "idempotent" comment), so a
    // fresh listener per `it` would leak indefinitely for the rest of this
    // browser session. Instead, this block subscribes exactly ONCE (in
    // beforeAll) on one dedicated instance and reuses it for every test here.
    let streamingService: ChannelsApiService;
    let streamingUserStore: UserStore;

    beforeAll(() => {
      // Deliberately NOT TestBed here: TestBed only allows one
      // configureTestingModule()/instantiation per spec, and the outer
      // `beforeEach` above configures+instantiates a fresh TestBed module for
      // every `it` (including these). A plain Injector, independent of the
      // TestBed harness, lets this block keep one long-lived instance (with
      // its one permanent onSnapshot listener) without conflicting with that.
      const injector = Injector.create({
        providers: [{ provide: Firestore, useValue: sharedTestFirestore() }, UserStore, ChannelsApiService],
      });
      streamingService = injector.get(ChannelsApiService);
      streamingUserStore = injector.get(UserStore);
      streamingService.subChannels();
    });

    afterEach(() => {
      streamingUserStore.setCurrentUser(null);
    });

    it('populates _allChannels (via myChannels) with toEntity-shaped channels for a member user', async () => {
      const member = makeUser();
      const channelId = 'chan-member-test';
      await seedChannel(firestore, { id: channelId, name: 'Team', member: [{ id: member.id }] });

      streamingUserStore.setCurrentUser(member);

      await waitFor(() => streamingService.myChannels().some((c) => c.id === channelId));
      const found = streamingService.myChannels().find((c) => c.id === channelId)!;
      expect(found.name).toBe('Team');
    });

    it('returns [] when there is no current user', () => {
      expect(streamingService.myChannels()).toEqual([]);
    });

    it('filters to channels where the member array contains the current (non-guest) user', async () => {
      const user = makeUser({ email: 'not-a-guest@test.local' });
      const other = makeUser();
      await seedChannel(firestore, { id: 'chan-mine', member: [{ id: user.id }] });
      await seedChannel(firestore, { id: 'chan-not-mine', member: [{ id: other.id }] });

      streamingUserStore.setCurrentUser(user);

      await waitFor(() => streamingService.myChannels().some((c) => c.id === 'chan-mine'));
      const ids = streamingService.myChannels().map((c) => c.id);
      expect(ids).toContain('chan-mine');
      expect(ids).not.toContain('chan-not-mine');
    });

    it('for a guest user, includes DEFAULT_CHANNEL_ID and channels created by the guest, but not channels merely containing them as a member', async () => {
      const guest = makeUser({ id: 'guest-1', email: GUEST_EMAIL });
      await seedChannel(firestore, { id: DEFAULT_CHANNEL_ID, name: 'Default', member: [] });
      await seedChannel(firestore, { id: 'guest-created', createdBy: guest.id, member: [] });
      await seedChannel(firestore, { id: 'guest-is-member-only', member: [{ id: guest.id }], createdBy: 'someone-else' });

      streamingUserStore.setCurrentUser(guest);

      await waitFor(() => streamingService.myChannels().some((c) => c.id === 'guest-created'));
      const ids = streamingService.myChannels().map((c) => c.id);
      expect(ids).toContain(DEFAULT_CHANNEL_ID);
      expect(ids).toContain('guest-created');
      expect(ids).not.toContain('guest-is-member-only');
    });

    it('is idempotent: calling subChannels() a second time on the same instance does not throw or start a second listener', async () => {
      expect(() => streamingService.subChannels()).not.toThrow();

      const user = makeUser();
      await seedChannel(firestore, { id: 'chan-idempotent', member: [{ id: user.id }] });
      streamingUserStore.setCurrentUser(user);

      await waitFor(() => streamingService.myChannels().some((c) => c.id === 'chan-idempotent'));
    });
  });

  describe('subChannelDoc', () => {
    it('fires the callback with a toEntity-shaped channel when the doc exists', (done) => {
      seedChannel(firestore, { id: 'chan-doc', name: 'DocTest' }).then(() => {
        const unsub = service.subChannelDoc('chan-doc', (channel) => {
          expect(channel).not.toBeNull();
          expect(channel?.id).toBe('chan-doc');
          expect(channel?.name).toBe('DocTest');
          unsub();
          done();
        });
        activeUnsubs.push(unsub);
      });
    });

    it('fires the callback with null when the doc does not exist', (done) => {
      const unsub = service.subChannelDoc('does-not-exist', (channel) => {
        expect(channel).toBeNull();
        unsub();
        done();
      });
      activeUnsubs.push(unsub);
    });
  });

  describe('getChannelOnce', () => {
    it('returns a toEntity-shaped channel when the doc exists', async () => {
      await seedChannel(firestore, { id: 'chan-once', name: 'Once' });
      const channel = await service.getChannelOnce('chan-once');
      expect(channel?.id).toBe('chan-once');
      expect(channel?.name).toBe('Once');
    });

    it('returns null when the doc does not exist', async () => {
      const channel = await service.getChannelOnce('nope');
      expect(channel).toBeNull();
    });
  });

  describe('addChannel', () => {
    it('creates a new channel document with the given data', async () => {
      const data = { name: 'New Channel', description: 'desc', member: [], createdAt: new Date(), createdBy: 'u1' };
      await service.addChannel(data);

      const snap = await getDoc(doc(collection(firestore, 'channels'), (await service.findChannelByName('New Channel'))!.id));
      expect(snap.data()?.['name']).toBe('New Channel');
    });
  });

  describe('updateChannelData', () => {
    it('is a no-op and resolves undefined when channelId is falsy', async () => {
      const result = await service.updateChannelData('', { name: 'x' });
      expect(result).toBeUndefined();
    });

    it('merges name/description fields on an existing document', async () => {
      await seedChannel(firestore, { id: 'chan-upd', name: 'Old', description: 'old-desc' });
      await service.updateChannelData('chan-upd', { name: 'New' });

      const snap = await getDoc(doc(firestore, 'channels', 'chan-upd'));
      expect(snap.data()?.['name']).toBe('New');
      expect(snap.data()?.['description']).toBe('old-desc');
    });

    it('rejects and logs via runWrite when the target document does not exist (genuine Firestore failure)', async () => {
      const consoleSpy = spyOn(console, 'error');
      await expectAsync(service.updateChannelData('missing-channel', { name: 'x' })).toBeRejected();
      expect(consoleSpy).toHaveBeenCalledWith('Fehler beim Aktualisieren der Channel-Daten:', jasmine.anything());
    });
  });

  describe('addChannelMembers', () => {
    it('is a no-op and resolves undefined when channelId is falsy', async () => {
      const result = await service.addChannelMembers('', [{ id: 'u1' }]);
      expect(result).toBeUndefined();
    });

    it('is a no-op and resolves undefined when memberObjects is an empty array', async () => {
      await seedChannel(firestore, { id: 'chan-empty-members', member: [] });
      const result = await service.addChannelMembers('chan-empty-members', []);
      expect(result).toBeUndefined();

      const snap = await getDoc(doc(firestore, 'channels', 'chan-empty-members'));
      expect(snap.data()?.['member']).toEqual([]);
    });

    it('adds members via arrayUnion without duplicating an already-present member', async () => {
      await seedChannel(firestore, { id: 'chan-members', member: [{ id: 'existing' }] });
      await service.addChannelMembers('chan-members', [{ id: 'existing' }, { id: 'new-one' }]);

      const snap = await getDoc(doc(firestore, 'channels', 'chan-members'));
      const member = snap.data()?.['member'] as { id: string }[];
      expect(member.length).toBe(2);
      expect(member.map((m) => m.id).sort()).toEqual(['existing', 'new-one']);
    });

    it('rejects and logs via runWrite when the target document does not exist (genuine Firestore failure)', async () => {
      const consoleSpy = spyOn(console, 'error');
      await expectAsync(service.addChannelMembers('missing-channel', [{ id: 'u1' }])).toBeRejected();
      expect(consoleSpy).toHaveBeenCalledWith('Fehler beim Hinzufügen von Mitgliedern:', jasmine.anything());
    });
  });

  describe('leaveChannel', () => {
    it('removes the given member from the member array via arrayRemove', async () => {
      await seedChannel(firestore, { id: 'chan-leave', member: [{ id: 'staying' }, { id: 'leaving' }] });
      await service.leaveChannel('chan-leave', 'leaving');

      const snap = await getDoc(doc(firestore, 'channels', 'chan-leave'));
      const member = snap.data()?.['member'] as { id: string }[];
      expect(member.map((m) => m.id)).toEqual(['staying']);
    });

    it('rejects and logs via runWrite when the target document does not exist (genuine Firestore failure)', async () => {
      const consoleSpy = spyOn(console, 'error');
      await expectAsync(service.leaveChannel('missing-channel', 'u1')).toBeRejected();
      expect(consoleSpy).toHaveBeenCalledWith('Fehler beim Verlassen des Channels:', jasmine.anything());
    });
  });

  describe('checkChannelNameExists / findChannelByName', () => {
    it('findChannelByName returns the matching channel', async () => {
      await seedChannel(firestore, { id: 'chan-find', name: 'Uniquename' });
      const found = await service.findChannelByName('Uniquename');
      expect(found?.id).toBe('chan-find');
    });

    it('findChannelByName trims the search term before querying', async () => {
      await seedChannel(firestore, { id: 'chan-trim', name: 'Trimmed' });
      const found = await service.findChannelByName('  Trimmed  ');
      expect(found?.id).toBe('chan-trim');
    });

    it('findChannelByName returns null when no channel matches', async () => {
      const found = await service.findChannelByName('nope-does-not-exist');
      expect(found).toBeNull();
    });

    it('checkChannelNameExists returns true when a channel with that name exists', async () => {
      await seedChannel(firestore, { id: 'chan-exists', name: 'ExistsName' });
      await expectAsync(service.checkChannelNameExists('ExistsName')).toBeResolvedTo(true);
    });

    it('checkChannelNameExists returns false when no channel with that name exists', async () => {
      await expectAsync(service.checkChannelNameExists('NoSuchName')).toBeResolvedTo(false);
    });
  });
});
