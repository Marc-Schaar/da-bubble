// One-off seed script for local/dev Firestore data.
// Needs a service account key (Firebase console -> Project settings -> Service accounts
// -> Generate new private key), saved as serviceAccountKey.json in the repo root
// (already gitignored), or point GOOGLE_APPLICATION_CREDENTIALS at it.
//
// Run with: npm run seed

import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp, cert, applicationDefault } from 'firebase-admin/app';
import { getFirestore, Timestamp } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, '..', 'serviceAccountKey.json');

const app = existsSync(serviceAccountPath)
  ? initializeApp({ credential: cert(JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))) })
  : initializeApp({ credential: applicationDefault() });

const db = getFirestore(app);

// Must match `defaultChannelId` in src/environments/environment*.ts.
const DEFAULT_CHANNEL_ID = 'allgemein';

const AVATAR_IMAGES = [
  'img/avatars/avatar_1.png',
  'img/avatars/avatar_2.png',
  'img/avatars/avatar_3.png',
  'img/avatars/avatar_4.png',
  'img/avatars/avatar_5.png',
  'img/avatars/avatar_6.png',
];

const DUMMY_USERS = [
  { firstName: 'Anna', lastName: 'Fischer' },
  { firstName: 'Max', lastName: 'Weber' },
  { firstName: 'Lena', lastName: 'Schmidt' },
  { firstName: 'Paul', lastName: 'Meyer' },
  { firstName: 'Sara', lastName: 'Klein' },
  { firstName: 'Tom', lastName: 'Hoffmann' },
  { firstName: 'Nina', lastName: 'Wagner' },
  { firstName: 'Felix', lastName: 'Becker' },
  { firstName: 'Julia', lastName: 'Schulz' },
  { firstName: 'David', lastName: 'Krueger' },
];

async function seedUsers() {
  const usersRef = db.collection('users');
  const users = [];

  for (const [index, { firstName, lastName }] of DUMMY_USERS.entries()) {
    const docRef = usersRef.doc();
    const user = {
      id: docRef.id,
      email: `${firstName}.${lastName}@dummy.dabubble.app`.toLowerCase(),
      displayName: `${firstName} ${lastName}`,
      photoUrl: AVATAR_IMAGES[index % AVATAR_IMAGES.length],
      online: index % 3 !== 0,
    };
    await docRef.set(user);
    users.push(user);
    console.log(`Nutzer angelegt: ${user.displayName} (${user.id})`);
  }

  return users;
}

async function seedChannels(users) {
  const channelsRef = db.collection('channels');
  const [owner] = users;
  const now = Timestamp.now();

  const channelDefs = [
    {
      id: DEFAULT_CHANNEL_ID,
      name: 'Allgemein',
      description: 'Allgemeiner Austausch für alle Mitglieder',
      member: users,
    },
    {
      name: 'Entwicklerteam',
      description: 'Technische Absprachen und Code-Reviews',
      member: users.slice(0, 6),
    },
    {
      name: 'Marketing',
      description: 'Kampagnen, Content und Social Media',
      member: users.slice(3, 8),
    },
    {
      name: 'Zufallsgenerator',
      description: 'Off-Topic und lockerer Austausch',
      member: users.slice(2, 9),
    },
    {
      name: 'Support',
      description: 'Fragen und Hilfe rund um die App',
      member: [users[0], users[1], users[9]],
    },
  ];

  for (const { id, name, description, member } of channelDefs) {
    const docRef = id ? channelsRef.doc(id) : channelsRef.doc();
    const channel = {
      name,
      description,
      member: member.map((u) => ({ id: u.id })),
      createdBy: owner.id,
      createdAt: now,
    };
    await docRef.set(channel);
    console.log(`Channel angelegt: ${name} (${docRef.id})`);
  }
}

async function main() {
  const users = await seedUsers();
  await seedChannels(users);
  console.log('\nFertig. Standard-Channel-ID:', DEFAULT_CHANNEL_ID);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed fehlgeschlagen:', error);
    process.exit(1);
  });