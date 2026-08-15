// One-off script:
// 1. Removes the previously seeded dummy users (identified by their
//    @dummy.dabubble.app email domain) and replaces them with a more
//    diverse set of names.
// 2. Distributes ~100 chat messages across the existing channels.
// 3. Seeds a short direct-message conversation between the guest user and
//    one of the new dummy users.
//
// Requires channels to already exist (run `npm run seed` first).
// Run with: npm run seed-content

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getDb } from './lib/firebase-admin.mjs';

const db = getDb();

const OLD_DUMMY_EMAIL_SUFFIX = '@dummy.dabubble.app';
const GUEST_EMAIL = 'gast@portfolio.de';
const TOTAL_MESSAGES = 100;

const AVATAR_IMAGES = [
  'img/avatars/avatar_1.png',
  'img/avatars/avatar_2.png',
  'img/avatars/avatar_3.png',
  'img/avatars/avatar_4.png',
  'img/avatars/avatar_5.png',
  'img/avatars/avatar_6.png',
];

const DUMMY_USERS = [
  { firstName: 'Amara', lastName: 'Okafor' },
  { firstName: 'Mateo', lastName: 'Rodriguez' },
  { firstName: 'Yuki', lastName: 'Tanaka' },
  { firstName: 'Fatima', lastName: 'AlSayed' },
  { firstName: 'Liam', lastName: 'OConnor' },
  { firstName: 'Priya', lastName: 'Sharma' },
  { firstName: 'Chen', lastName: 'Wei' },
  { firstName: 'Sofia', lastName: 'Rossi' },
  { firstName: 'Kwame', lastName: 'Mensah' },
  { firstName: 'Elif', lastName: 'Yildiz' },
  { firstName: 'Noah', lastName: 'Andersson' },
  { firstName: 'Zainab', lastName: 'Hussain' },
  { firstName: 'Efisio', lastName: 'Melis' },
  { firstName: 'Gavino', lastName: 'Piras' },
  { firstName: 'Rosalia', lastName: 'Cocco' },
];

const MESSAGE_POOL = [
  'Guten Morgen zusammen! ☀️',
  'Hat jemand die Notizen vom letzten Meeting?',
  'Ich bin gleich für 30 Minuten weg, meldet euch bei Fragen per DM.',
  'Kann jemand kurz über den neuen Vorschlag drüberschauen?',
  'Danke für die schnelle Rückmeldung! 🙏',
  'Wer hat Lust auf einen Kaffee in 15 Minuten?',
  'Ich habe den Task gerade abgeschlossen, bitte einmal gegenchecken.',
  'Das klingt nach einem guten Plan, lass uns das so machen.',
  'Kleine Erinnerung: Deadline ist morgen Nachmittag.',
  'Super Idee, das probiere ich gleich aus!',
  'Kann mir jemand kurz helfen, ich hänge gerade fest.',
  'Alles klar, ich kümmere mich darum.',
  'Habt ihr das aktuelle Update schon gesehen?',
  'Von mir aus passt der Termin.',
  'Ich schicke euch gleich die Unterlagen.',
  'Ist noch jemand online? Kurze Frage.',
  'Perfekt, danke euch allen für die Unterstützung!',
  'Lasst uns das Thema im nächsten Meeting besprechen.',
  'Ich habe da noch ein paar Anmerkungen, schreib ich gleich rein.',
  'Klingt gut, bin dabei 👍',
  'Wie ist der aktuelle Stand bei euch?',
  'Ich melde mich morgen früh dazu nochmal.',
  'Vielen Dank fürs Feedback, sehr hilfreich!',
  'Können wir das kurz in einem Call klären?',
  'Ich bin gerade etwas im Stress, melde mich später ausführlich.',
  'Wer übernimmt den nächsten Schritt?',
  'Das sieht schon richtig gut aus!',
  'Gibt es Neuigkeiten zu dem Thema von letzter Woche?',
  'Ich habe ein paar Ideen dazu, lasst uns brainstormen.',
  'Passt, ich trage es in den Kalender ein.',
  'Kurze Frage: hat das schon jemand getestet?',
  'Läuft bei mir gerade einwandfrei, danke!',
  'Ich schaue es mir heute Abend nochmal in Ruhe an.',
  'Top, dann sind wir uns einig.',
  'Kann jemand die Zugriffsrechte freischalten?',
  'Ich bin gespannt, wie das beim Kunden ankommt.',
  'Lasst uns das nächste Woche nochmal aufgreifen.',
  'Danke für die Geduld, ist erledigt!',
  'Wo finde ich die aktuellste Version der Datei?',
  'Alles gut bei euch? Schon lange nichts gehört.',
];

function randomItem(list) {
  return list[Math.floor(Math.random() * list.length)];
}

function buildUserDoc(docRef, index, { firstName, lastName }) {
  return {
    id: docRef.id,
    email: `${firstName}.${lastName}@dummy.dabubble.app`.toLowerCase(),
    displayName: `${firstName} ${lastName}`,
    photoUrl: AVATAR_IMAGES[index % AVATAR_IMAGES.length],
    online: index % 3 !== 0,
  };
}

async function removeOldDummyUsers() {
  const usersSnapshot = await db.collection('users').get();
  const oldUsers = usersSnapshot.docs.filter((d) => (d.data().email || '').endsWith(OLD_DUMMY_EMAIL_SUFFIX));

  if (oldUsers.length === 0) {
    console.log('Keine alten Dummy-User zum Entfernen gefunden.');
    return;
  }

  const channelsSnapshot = await db.collection('channels').get();
  const oldMemberEntries = oldUsers.map((d) => ({ id: d.id }));

  await Promise.all(channelsSnapshot.docs.map((c) => c.ref.update({ member: FieldValue.arrayRemove(...oldMemberEntries) })));
  await Promise.all(oldUsers.map((d) => d.ref.delete()));

  console.log(`${oldUsers.length} alte Dummy-User entfernt (aus users-Collection und allen Channels).`);
}

async function createDiverseUsers() {
  const usersRef = db.collection('users');
  const users = [];

  for (const [index, nameParts] of DUMMY_USERS.entries()) {
    const docRef = usersRef.doc();
    const user = buildUserDoc(docRef, index, nameParts);
    await docRef.set(user);
    users.push(user);
    console.log(`Nutzer angelegt: ${user.displayName} (${user.id})`);
  }

  return users;
}

async function addUsersToChannels(users, channels) {
  const memberSlices = {
    default: users,
    secondary: users.slice(0, Math.ceil(users.length * 0.6)),
    tertiary: users.slice(Math.floor(users.length * 0.3)),
  };

  for (const [index, channel] of channels.entries()) {
    const slice = index === 0 ? memberSlices.default : index % 2 === 0 ? memberSlices.secondary : memberSlices.tertiary;
    await channel.ref.update({ member: FieldValue.arrayUnion(...slice.map((u) => ({ id: u.id }))) });
  }

  console.log(`Neue Nutzer zu ${channels.length} Channel(s) hinzugefügt.`);
}

function distributeCounts(total, bucketCount) {
  const weights = Array.from({ length: bucketCount }, () => Math.random() + 0.5);
  const weightSum = weights.reduce((a, b) => a + b, 0);
  const counts = weights.map((w) => Math.floor((w / weightSum) * total));

  let remainder = total - counts.reduce((a, b) => a + b, 0);
  for (let i = 0; remainder > 0; i = (i + 1) % bucketCount, remainder--) {
    counts[i]++;
  }

  return counts;
}

async function seedChannelMessages(users, channels) {
  const counts = distributeCounts(TOTAL_MESSAGES, channels.length);
  const rangeStart = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const rangeEnd = Date.now();

  for (const [index, channel] of channels.entries()) {
    const count = counts[index];
    const messagesRef = channel.ref.collection('messages');

    const timestamps = Array.from({ length: count }, () => rangeStart + Math.random() * (rangeEnd - rangeStart)).sort((a, b) => a - b);

    for (const ms of timestamps) {
      const author = randomItem(users);
      await messagesRef.add({
        name: author.displayName,
        photoUrl: author.photoUrl,
        message: randomItem(MESSAGE_POOL),
        timestamp: Timestamp.fromMillis(ms),
        reaction: [],
      });
    }

    console.log(`${count} Nachrichten in Channel "${channel.data().name}" geschrieben.`);
  }
}

async function seedGuestDirectMessages(users) {
  const guestSnapshot = await db.collection('users').where('email', '==', GUEST_EMAIL).get();

  if (guestSnapshot.empty) {
    console.log('Kein Gast-User gefunden — Direktnachrichten werden übersprungen (einmal als Gast einloggen und Skript erneut ausführen).');
    return;
  }

  const guest = { id: guestSnapshot.docs[0].id, ...guestSnapshot.docs[0].data() };
  const partner = users[0];
  const conversationId = [guest.id, partner.id].sort().join('_');
  const start = Date.now() - 2 * 60 * 60 * 1000;

  const conversation = [
    { from: partner, to: guest, text: 'Hey, willkommen im Team! 👋' },
    { from: guest, to: partner, text: 'Danke! Freut mich, hier zu sein.' },
    { from: partner, to: guest, text: 'Lass mich wissen, falls du Fragen hast.' },
    { from: guest, to: partner, text: 'Mach ich, danke dir!' },
    { from: partner, to: guest, text: 'Schau gern mal im Allgemein-Channel vorbei, da ist immer was los.' },
    { from: guest, to: partner, text: 'Werde ich tun 🙂' },
  ];

  const guestConvRef = db.collection('users').doc(guest.id).collection('conversations').doc(conversationId).collection('messages');
  const partnerConvRef = db.collection('users').doc(partner.id).collection('conversations').doc(conversationId).collection('messages');

  for (const [index, entry] of conversation.entries()) {
    const data = {
      name: entry.from.displayName,
      photoUrl: entry.from.photoUrl,
      message: entry.text,
      timestamp: Timestamp.fromMillis(start + index * 5 * 60 * 1000),
      from: entry.from.id,
      to: entry.to.id,
    };
    await Promise.all([guestConvRef.add(data), partnerConvRef.add(data)]);
  }

  console.log(`${conversation.length} Direktnachrichten zwischen Gast und ${partner.displayName} erstellt.`);
}

async function main() {
  await removeOldDummyUsers();
  const users = await createDiverseUsers();

  const channelsSnapshot = await db.collection('channels').get();
  if (channelsSnapshot.empty) {
    console.error('Keine Channels gefunden. Bitte zuerst "npm run seed" ausführen.');
    process.exit(1);
  }
  const channels = channelsSnapshot.docs;

  await addUsersToChannels(users, channels);
  await seedChannelMessages(users, channels);
  await seedGuestDirectMessages(users);

  console.log('\nFertig.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed fehlgeschlagen:', error);
    process.exit(1);
  });