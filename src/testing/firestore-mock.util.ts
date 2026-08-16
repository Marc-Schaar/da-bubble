/**
 * Helpers for tests that run Firestore/Auth API services against the local
 * Firebase Emulator Suite (see firebase.json) instead of deep-mocking the
 * @angular/fire SDK. Requires `firebase emulators:exec ... "npm run test:ci"`
 * (or `emulators:start` in a separate terminal during development).
 */
export const FIRESTORE_EMULATOR_HOST = 'localhost:8080';
export const AUTH_EMULATOR_HOST = 'localhost:9099';
export const EMULATOR_PROJECT_ID = 'demo-dabubble';

/** Wipes every document in every collection of the Firestore emulator. Call in afterEach/afterAll. */
export async function wipeFirestoreEmulator(): Promise<void> {
  const url = `http://${FIRESTORE_EMULATOR_HOST}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/databases/(default)/documents`;
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to wipe Firestore emulator: ${response.status} ${await response.text()}`);
  }
}

/** Deletes every Auth user in the emulator. Call in afterEach/afterAll for specs that create users. */
export async function wipeAuthEmulator(): Promise<void> {
  const url = `http://${AUTH_EMULATOR_HOST}/emulator/v1/projects/${EMULATOR_PROJECT_ID}/accounts`;
  const response = await fetch(url, { method: 'DELETE' });
  if (!response.ok && response.status !== 404) {
    throw new Error(`Failed to wipe Auth emulator: ${response.status} ${await response.text()}`);
  }
}
