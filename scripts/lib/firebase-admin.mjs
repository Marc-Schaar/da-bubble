import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { initializeApp, cert, applicationDefault, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));
const serviceAccountPath = join(__dirname, '..', '..', 'serviceAccountKey.json');

export function getDb() {
  const app =
    getApps()[0] ??
    (existsSync(serviceAccountPath)
      ? initializeApp({ credential: cert(JSON.parse(readFileSync(serviceAccountPath, 'utf-8'))) })
      : initializeApp({ credential: applicationDefault() }));

  return getFirestore(app);
}