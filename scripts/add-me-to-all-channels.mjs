// One-off script: adds a single user (by email) to every existing channel's
// member list. Uses the same service account setup as seed-dummy-data.mjs.
//
// Run with: npm run add-me

import { FieldValue } from 'firebase-admin/firestore';
import { getDb } from './lib/firebase-admin.mjs';

const db = getDb();

const TARGET_EMAIL = 'kontakt@marc-schaar.com';

async function main() {
  const usersSnapshot = await db.collection('users').where('email', '==', TARGET_EMAIL).get();

  if (usersSnapshot.empty) {
    console.error(
      `Kein Nutzer mit E-Mail "${TARGET_EMAIL}" in der users-Collection gefunden.\n` +
        'Bitte zuerst einmal in der App mit dieser E-Mail registrieren/einloggen, dann erneut ausführen.',
    );
    process.exit(1);
  }

  const userDoc = usersSnapshot.docs[0];
  const userId = userDoc.id;
  console.log(`Nutzer gefunden: ${userDoc.data().displayName ?? userId} (${userId})`);

  const channelsSnapshot = await db.collection('channels').get();
  if (channelsSnapshot.empty) {
    console.log('Keine Channels vorhanden.');
    return;
  }

  for (const channelDoc of channelsSnapshot.docs) {
    await channelDoc.ref.update({ member: FieldValue.arrayUnion({ id: userId }) });
    console.log(`Hinzugefügt zu: ${channelDoc.data().name} (${channelDoc.id})`);
  }

  console.log(`\nFertig. Zu ${channelsSnapshot.size} Channel(s) hinzugefügt.`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Fehlgeschlagen:', error);
    process.exit(1);
  });