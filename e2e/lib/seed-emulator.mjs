// Seeds the Firebase Auth + Firestore emulators with a small, fixed cast of
// users/channels/messages for Playwright specs to run against. Adapted from
// scripts/seed-dummy-data.mjs + scripts/lib/firebase-admin.mjs, but pointed at
// the local emulators (no service account / real project needed) and trimmed
// to a minimal, deterministic fixture set instead of bulk dummy content.
import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

export const PROJECT_ID = 'demo-dabubble';
export const DEFAULT_CHANNEL_ID = 'allgemein';

process.env['FIRESTORE_EMULATOR_HOST'] ??= 'localhost:8080';
process.env['FIREBASE_AUTH_EMULATOR_HOST'] ??= 'localhost:9099';

function getApp() {
  return getApps()[0] ?? initializeApp({ projectId: PROJECT_ID });
}

export const TEST_USERS = [
  { key: 'alice', email: 'alice@test.local', password: 'Test1234!', displayName: 'Alice Test', photoUrl: 'img/avatars/avatar_1.png' },
  { key: 'bob', email: 'bob@test.local', password: 'Test1234!', displayName: 'Bob Test', photoUrl: 'img/avatars/avatar_2.png' },
];

async function wipeAuth() {
  const auth = getAuth(getApp());
  const { users } = await auth.listUsers(1000);
  if (users.length) {
    await auth.deleteUsers(users.map((u) => u.uid));
  }
}

async function wipeFirestore() {
  const host = process.env['FIRESTORE_EMULATOR_HOST'];
  const url = `http://${host}/emulator/v1/projects/${PROJECT_ID}/databases/(default)/documents`;
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to wipe Firestore emulator: ${response.status} ${await response.text()}`);
  }
}

/** Wipes all Auth users and Firestore documents. Safe to call between/after test runs. */
export async function wipe() {
  await Promise.all([wipeAuth(), wipeFirestore()]);
}

async function seedUsers() {
  const auth = getAuth(getApp());
  const db = getFirestore(getApp());
  const usersById = {};

  for (const { key, email, password, displayName, photoUrl } of TEST_USERS) {
    const record = await auth.createUser({ email, password, displayName, emailVerified: true });
    const user = { id: record.uid, email, displayName, photoUrl, online: false };
    await db.collection('users').doc(user.id).set(user);
    usersById[key] = user;
  }

  return usersById;
}

async function seedChannels(usersById) {
  const db = getFirestore(getApp());
  const { alice, bob } = usersById;
  const now = Timestamp.now();

  await db
    .collection('channels')
    .doc(DEFAULT_CHANNEL_ID)
    .set({
      name: 'Allgemein',
      description: 'Allgemeiner Austausch für alle Mitglieder',
      member: [{ id: alice.id }, { id: bob.id }],
      createdBy: alice.id,
      createdAt: now,
    });

  const secondChannelRef = db.collection('channels').doc();
  await secondChannelRef.set({
    name: 'Entwicklerteam',
    description: 'Technische Absprachen',
    member: [{ id: alice.id }, { id: bob.id }],
    createdBy: alice.id,
    createdAt: now,
  });

  return { defaultChannelId: DEFAULT_CHANNEL_ID, secondChannelId: secondChannelRef.id };
}

/** Wipes the emulators, then seeds a fixed set of users/channels for e2e specs. */
export async function resetEmulatorAndSeed() {
  await wipe();
  const usersById = await seedUsers();
  const channelIds = await seedChannels(usersById);
  return { users: usersById, channels: channelIds };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  resetEmulatorAndSeed()
    .then((result) => {
      console.log('Emulator geseedet:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seed fehlgeschlagen:', error);
      process.exit(1);
    });
}
