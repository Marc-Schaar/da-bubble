// One-off script:
// 1. Removes the previously seeded dummy users (identified by their
//    @dummy.dabubble.app email domain) and replaces them with a more
//    diverse set of names.
// 2. Seeds each channel with a handful of coherent, multi-message
//    conversation threads (topically matched to the channel) instead of
//    unrelated single lines.
// 3. Adds the guest user to the Support channel and lets it take part in a
//    couple of those threads (asking a question, and answering someone
//    else's).
// 4. Seeds a short direct-message conversation between the guest user and
//    one of the new dummy users.
//
// Requires channels to already exist (run `npm run seed` first).
// Run with: npm run seed-content

import { FieldValue, Timestamp } from 'firebase-admin/firestore';
import { getDb } from './lib/firebase-admin.mjs';

const db = getDb();

const OLD_DUMMY_EMAIL_SUFFIX = '@dummy.dabubble.app';
const GUEST_EMAIL = 'gast@portfolio.de';

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

// Each thread is a short, ordered exchange. `speaker` is a per-thread index
// (any two equal numbers = same person); it gets mapped onto real channel
// members at seed time. `speaker: 'guest'` is only used for Support and only
// resolved when a guest user actually exists.
const CHANNEL_THREADS = {
  Allgemein: [
    [
      { speaker: 0, text: 'Guten Morgen zusammen! Wie war euer Wochenende?' },
      { speaker: 1, text: 'Morgen! War entspannt, ich war wandern. Und bei dir?' },
      { speaker: 0, text: 'Auch schön, hab hauptsächlich das neue Projektbrief gelesen.' },
      { speaker: 2, text: 'Und, wie sind deine ersten Eindrücke?' },
      { speaker: 0, text: 'Sieht vielversprechend aus, sollten wir im nächsten Meeting besprechen.' },
    ],
    [
      { speaker: 0, text: 'Kleine Erinnerung: Die Deadline für den Quartalsbericht ist morgen Nachmittag.' },
      { speaker: 1, text: 'Danke für die Erinnerung, bin fast fertig damit.' },
      { speaker: 2, text: 'Ich brauche noch etwas Zeit, melde mich bis heute Abend.' },
      { speaker: 0, text: 'Alles klar, kein Stress.' },
    ],
    [
      { speaker: 0, text: 'Habt ihr das neue Update schon gesehen? Sieht richtig gut aus.' },
      { speaker: 1, text: 'Ja, vor allem die neue Übersicht gefällt mir gut.' },
      { speaker: 2, text: 'Mir auch, endlich übersichtlicher als vorher.' },
      { speaker: 1, text: 'Genau, war längst überfällig 👍' },
    ],
    [
      { speaker: 0, text: 'Ist noch jemand online? Kurze Frage zum Kalender.' },
      { speaker: 1, text: 'Ja, was gibt’s?' },
      { speaker: 0, text: 'Ist der Termin am Freitag schon bestätigt?' },
      { speaker: 1, text: 'Noch nicht offiziell, aber ich gehe stark davon aus.' },
      { speaker: 0, text: 'Perfekt, danke dir!' },
    ],
    [
      { speaker: 'guest', text: 'Hallo zusammen, bin gerade als Gast reingekommen und wollte kurz Hallo sagen 👋' },
      { speaker: 0, text: 'Hey, schön dass du da bist! Herzlich willkommen 🙌' },
      { speaker: 'guest', text: 'Danke euch! Schaue mich gerade ein bisschen um.' },
      { speaker: 1, text: 'Lass es dir gemütlich machen, bei Fragen sind wir da.' },
      { speaker: 'guest', text: 'Mach ich, freut mich hier zu sein!' },
    ],
  ],
  Entwicklerteam: [
    [
      { speaker: 0, text: 'Kann jemand kurz über meinen Pull Request drüberschauen?' },
      { speaker: 1, text: 'Klar, schick mir den Link.' },
      { speaker: 0, text: 'Danke, ist gerade rein, betrifft das Login-Modul.' },
      { speaker: 1, text: 'Schau ich mir gleich an, gib mir 10 Minuten.' },
      { speaker: 1, text: 'Sieht gut aus, nur eine kleine Anmerkung zum Error-Handling.' },
      { speaker: 0, text: 'Passt, kümmere mich gleich darum.' },
    ],
    [
      { speaker: 2, text: 'Der neue Build wirft einen Fehler beim Deployment.' },
      { speaker: 0, text: 'Welche Fehlermeldung genau?' },
      { speaker: 2, text: 'Sieht nach einem fehlenden Environment-Wert aus.' },
      { speaker: 0, text: 'Ah, das kenn ich, hab die Variable in der Config ergänzt.' },
      { speaker: 2, text: 'Läuft jetzt wieder, danke für die schnelle Hilfe!' },
    ],
    [
      { speaker: 1, text: 'Wie ist der aktuelle Stand beim Refactoring?' },
      { speaker: 3, text: 'Bin gut vorangekommen, die Hälfte der Module ist durch.' },
      { speaker: 1, text: 'Stark! Gibt es Blocker, bei denen ich helfen kann?' },
      { speaker: 3, text: 'Aktuell nicht, melde mich falls doch.' },
    ],
    [
      { speaker: 0, text: 'Habt ihr die neuen Tests schon laufen lassen?' },
      { speaker: 2, text: 'Ja, bei mir läuft alles grün.' },
      { speaker: 3, text: 'Bei mir auch, allerdings etwas langsamer als vorher.' },
      { speaker: 0, text: 'Gut zu wissen, schau ich mir bei Gelegenheit an.' },
    ],
  ],
  Marketing: [
    [
      { speaker: 0, text: 'Wie kommt die neue Kampagne bei euch an?' },
      { speaker: 1, text: 'Die ersten Zahlen sehen vielversprechend aus!' },
      { speaker: 0, text: 'Das freut mich zu hören, welche Klickrate haben wir?' },
      { speaker: 1, text: 'Rund 4,5 %, deutlich über dem letzten Durchlauf.' },
      { speaker: 0, text: 'Top, dann behalten wir das Format bei.' },
    ],
    [
      { speaker: 2, text: 'Braucht noch jemand Material für den Social-Media-Post morgen?' },
      { speaker: 3, text: 'Ich könnte die aktuellen Grafiken gebrauchen.' },
      { speaker: 2, text: 'Schick ich dir gleich rüber.' },
      { speaker: 3, text: 'Perfekt, danke dir!' },
    ],
    [
      { speaker: 0, text: 'Ich bin gespannt, wie das neue Konzept beim Kunden ankommt.' },
      { speaker: 2, text: 'Das Feedback vom Vorgespräch war schon mal positiv.' },
      { speaker: 0, text: 'Sehr gut, dann sind wir auf einem guten Weg.' },
    ],
  ],
  Zufallsgenerator: [
    [
      { speaker: 0, text: 'Wer hat Lust auf einen Kaffee in 15 Minuten?' },
      { speaker: 1, text: 'Bin dabei ☕' },
      { speaker: 2, text: 'Ich komm auch dazu, brauch grad eh eine Pause.' },
      { speaker: 0, text: 'Perfekt, dann sehen wir uns in der Küche.' },
    ],
    [
      { speaker: 1, text: 'Hat jemand einen Serientipp für den Feierabend?' },
      { speaker: 3, text: 'Ich schau gerade eine ziemlich gute Doku-Serie, kann ich empfehlen.' },
      { speaker: 1, text: 'Klingt gut, wie heißt sie?' },
      { speaker: 3, text: 'Schick ich dir per DM, der Titel fällt mir grad nicht ein 😄' },
    ],
    [
      { speaker: 0, text: 'Wie war euer Wochenende, irgendwas Spannendes erlebt?' },
      { speaker: 2, text: 'War beim Konzert, richtig gute Stimmung!' },
      { speaker: 3, text: 'Oh schön, welche Band?' },
      { speaker: 2, text: 'Eine lokale Indie-Band, absolute Entdeckung.' },
    ],
  ],
  Support: [
    [
      { speaker: 'guest', text: 'Hallo zusammen, ich bin neu hier und hab eine kurze Frage zur Bedienung.' },
      { speaker: 0, text: 'Hey, herzlich willkommen! Frag einfach drauf los.' },
      { speaker: 'guest', text: 'Wie starte ich am einfachsten eine private Unterhaltung mit jemandem?' },
      { speaker: 0, text: 'Oben rechts auf "Neue Nachricht" klicken und die Person auswählen.' },
      { speaker: 'guest', text: 'Ah perfekt, vielen Dank für die schnelle Hilfe!' },
    ],
    [
      { speaker: 1, text: 'Weiß jemand, ob es schon eine mobile Version der App gibt?' },
      { speaker: 'guest', text: 'Meines Wissens nach noch nicht, aber die Web-Ansicht funktioniert auch auf dem Handy ganz gut.' },
      { speaker: 1, text: 'Ah, gut zu wissen, danke dir!' },
      { speaker: 'guest', text: 'Gerne! Falls es doch eine App gibt, sag mir gern Bescheid 🙂' },
    ],
    [
      { speaker: 0, text: 'Kann jemand die Zugriffsrechte für den neuen Kollegen freischalten?' },
      { speaker: 2, text: 'Mach ich gleich, sobald er sich einmal eingeloggt hat.' },
      { speaker: 0, text: 'Super, danke für die Geduld!' },
    ],
  ],
};

const GENERIC_THREADS = [
  [
    { speaker: 0, text: 'Gibt es Neuigkeiten zu dem Thema von letzter Woche?' },
    { speaker: 1, text: 'Noch nicht, ich hake nochmal nach und melde mich.' },
    { speaker: 0, text: 'Super, danke dir!' },
  ],
  [
    { speaker: 0, text: 'Kurze Frage: Hat das schon jemand getestet?' },
    { speaker: 1, text: 'Ja, läuft bei mir einwandfrei.' },
    { speaker: 0, text: 'Perfekt, dann sind wir uns einig.' },
  ],
];

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

  const channelMembers = new Map();

  for (const [index, channel] of channels.entries()) {
    const slice = index === 0 ? memberSlices.default : index % 2 === 0 ? memberSlices.secondary : memberSlices.tertiary;
    await channel.ref.update({ member: FieldValue.arrayUnion(...slice.map((u) => ({ id: u.id }))) });
    channelMembers.set(channel.id, slice);
  }

  console.log(`Neue Nutzer zu ${channels.length} Channel(s) hinzugefügt.`);
  return channelMembers;
}

async function findGuestUser() {
  const guestSnapshot = await db.collection('users').where('email', '==', GUEST_EMAIL).get();

  if (guestSnapshot.empty) {
    console.log('Kein Gast-User gefunden — Gast-Beiträge werden übersprungen (einmal als Gast einloggen und Skript erneut ausführen).');
    return null;
  }

  return { id: guestSnapshot.docs[0].id, ...guestSnapshot.docs[0].data() };
}

function channelHasGuestThread(channel) {
  const pool = CHANNEL_THREADS[channel.data().name];
  return Boolean(pool) && pool.some((thread) => thread.some((m) => m.speaker === 'guest'));
}

async function addGuestToChannels(guest, channels) {
  const targets = channels.filter(channelHasGuestThread);
  if (targets.length === 0) return;

  await Promise.all(targets.map((c) => c.ref.update({ member: FieldValue.arrayUnion({ id: guest.id }) })));
  console.log(`Gast-User zu ${targets.map((c) => c.data().name).join(', ')} hinzugefügt.`);
}

function distinctSpeakerCount(thread) {
  return new Set(thread.map((m) => m.speaker).filter((s) => s !== 'guest')).size;
}

function pickParticipants(members, count) {
  const pool = [...members];
  const picked = [];
  for (let i = 0; i < count && pool.length > 0; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picked.push(pool.splice(idx, 1)[0]);
  }
  return picked;
}

async function seedChannelMessages(channelMembers, channels, guest) {
  const rangeStart = Date.now() - 14 * 24 * 60 * 60 * 1000;
  const rangeEnd = Date.now() - 60 * 60 * 1000;
  let totalMessages = 0;

  for (const channel of channels) {
    const data = channel.data();
    const channelUsers = channelMembers.get(channel.id) || [];
    if (channelUsers.length === 0) continue;

    const pool = CHANNEL_THREADS[data.name] || GENERIC_THREADS;
    const includeGuest = Boolean(guest) && channelHasGuestThread(channel);
    const threads = includeGuest ? pool : pool.filter((t) => !t.some((m) => m.speaker === 'guest'));

    const messagesRef = channel.ref.collection('messages');
    let threadStart = rangeStart;
    let channelMessageCount = 0;

    for (const thread of threads) {
      const requiredSpeakers = distinctSpeakerCount(thread);
      const participants = pickParticipants(channelUsers, requiredSpeakers);
      const speakerMap = new Map();
      let pIndex = 0;

      threadStart += Math.random() * ((rangeEnd - rangeStart) / threads.length);
      let ts = threadStart;

      for (const m of thread) {
        let author = guest;
        if (m.speaker !== 'guest') {
          if (!speakerMap.has(m.speaker)) speakerMap.set(m.speaker, participants[pIndex++ % participants.length]);
          author = speakerMap.get(m.speaker);
        }
        if (!author) continue;

        await messagesRef.add({
          name: author.displayName,
          photoUrl: author.photoUrl,
          message: m.text,
          timestamp: Timestamp.fromMillis(Math.min(ts, rangeEnd)),
          reaction: [],
        });
        totalMessages++;
        channelMessageCount++;
        ts += (1 + Math.random() * 4) * 60 * 1000;
      }
    }

    console.log(`${channelMessageCount} Nachrichten in Channel "${data.name}" geschrieben.`);
  }

  console.log(`Insgesamt ${totalMessages} Nachrichten verteilt.`);
}

async function seedGuestDirectMessages(users, guest) {
  if (!guest) {
    console.log('Kein Gast-User gefunden — Direktnachrichten werden übersprungen.');
    return;
  }

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

  const channelMembers = await addUsersToChannels(users, channels);

  const guest = await findGuestUser();
  if (guest) {
    await addGuestToChannels(guest, channels);
  }

  await seedChannelMessages(channelMembers, channels, guest);
  await seedGuestDirectMessages(users, guest);

  console.log('\nFertig.');
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Seed fehlgeschlagen:', error);
    process.exit(1);
  });
