import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FirebaseApp, getApps, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Auth, connectAuthEmulator, createUserWithEmailAndPassword, getAuth, provideAuth, signInWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { UserStore } from '../../../../shared/services/user/user-store';
import { NotificationService } from '../../../../shared/services/notification/notification.service';
import { DEFAULT_CHANNEL_ID, GUEST_EMAIL } from '../../../../shared/constants';
import { RegisterData, User } from '../../models/user/user';
import { EMULATOR_PROJECT_ID, wipeAuthEmulator } from '../../../../../testing/firestore-mock.util';
import { AuthService } from './auth.service';

function sharedTestApp(): FirebaseApp {
  const existing = getApps();
  if (existing.length) return existing[0];
  return initializeApp({ projectId: EMULATOR_PROJECT_ID, apiKey: 'demo-api-key', authDomain: 'localhost' });
}

function sharedTestAuth(): Auth {
  const auth = getAuth(sharedTestApp());
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
  } catch {
    // already connected by an earlier spec file in this browser session
  }
  return auth;
}

async function waitFor(predicate: () => boolean, timeoutMs = 8000): Promise<void> {
  const start = Date.now();
  while (!predicate()) {
    if (Date.now() - start > timeoutMs) throw new Error('waitFor: timed out');
    await new Promise((resolve) => setTimeout(resolve, 30));
  }
}

/** Disables an Auth-emulator user via the Identity Toolkit REST surface the emulator implements, to force a real (non user-not-found/invalid-credential) sign-in error. `Authorization: Bearer owner` is the documented Auth-emulator convention for admin-level calls that bypass a real access token. */
async function disableAuthUser(uid: string): Promise<void> {
  const response = await fetch(`http://localhost:9099/identitytoolkit.googleapis.com/v1/projects/${EMULATOR_PROJECT_ID}/accounts:update`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: 'Bearer owner' },
    body: JSON.stringify({ localId: uid, disableUser: true }),
  });
  if (!response.ok) throw new Error(`Failed to disable user: ${response.status} ${await response.text()}`);
}

describe('AuthService', () => {
  let auth: Auth;
  let navigationService: jasmine.SpyObj<NavigationService>;
  let fireService: jasmine.SpyObj<FireServiceService>;
  let notificationService: jasmine.SpyObj<NotificationService>;
  let userStoreMock: { currentUser: () => User | null; setCurrentUser: jasmine.Spy };

  beforeAll(() => {
    // The first Auth round trip of a fresh browser session can take a few
    // seconds while the emulator connection warms up, occasionally exceeding
    // Jasmine's 5s default; registration/login round trips are also
    // inherently multi-step (create + profile update + Firestore sync).
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 20000;
  });

  beforeEach(() => {
    navigationService = jasmine.createSpyObj<NavigationService>('NavigationService', ['gotToChat', 'goToLogin']);
    fireService = jasmine.createSpyObj<FireServiceService>('FireServiceService', ['createUser', 'addChannelMembers', 'updateOnlineStatus', 'subUserDoc', 'updateUser']);
    fireService.createUser.and.resolveTo(undefined);
    fireService.addChannelMembers.and.resolveTo(undefined);
    fireService.updateOnlineStatus.and.resolveTo(undefined);
    fireService.updateUser.and.resolveTo(undefined);
    fireService.subUserDoc.and.returnValue(jasmine.createSpy('unsub'));
    notificationService = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);

    const currentUserSignal = signal<User | null>(null);
    userStoreMock = {
      currentUser: currentUserSignal.asReadonly(),
      setCurrentUser: jasmine.createSpy('setCurrentUser').and.callFake((u: User | null) => currentUserSignal.set(u)),
    };

    TestBed.configureTestingModule({
      providers: [
        provideFirebaseApp(() => sharedTestApp()),
        provideAuth(() => sharedTestAuth()),
        { provide: NavigationService, useValue: navigationService },
        { provide: FireServiceService, useValue: fireService },
        { provide: NotificationService, useValue: notificationService },
        { provide: UserStore, useValue: userStoreMock },
      ],
    });
    auth = TestBed.inject(Auth);
  });

  afterEach(async () => {
    if (auth.currentUser) await signOut(auth);
    await wipeAuthEmulator();
  });

  function createService(): AuthService {
    return TestBed.inject(AuthService);
  }

  // ---------------------------------------------------------------------
  // logInWithEmailAndPassword
  // ---------------------------------------------------------------------
  describe('logInWithEmailAndPassword', () => {
    it('success: toggles isLoading, updates online status, joins default channel, shows a success toast and navigates to chat', async () => {
      const email = `login-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, email, 'Password123!');
      await signOut(auth);
      const service = createService();

      const promise = service.logInWithEmailAndPassword(email, 'Password123!');
      expect(service.isLoading()).toBeTrue();
      await promise;
      expect(service.isLoading()).toBeFalse();

      expect(fireService.updateOnlineStatus).toHaveBeenCalled();
      const updatedUser = fireService.updateOnlineStatus.calls.mostRecent().args[0];
      expect(updatedUser.email).toBe(email);
      expect(updatedUser.online).toBeTrue();
      expect(updatedUser.displayName).toBe('Unbekannter Nutzer');
      expect(updatedUser.photoUrl).toBe('img/avatars/avatar_default.png');

      expect(fireService.addChannelMembers).toHaveBeenCalledWith(DEFAULT_CHANNEL_ID, [{ id: updatedUser.id }]);
      expect(notificationService.success).toHaveBeenCalledWith('Erfolgreich angemeldet!');
      expect(navigationService.gotToChat).toHaveBeenCalled();
      expect(service.errorMessage()).toBeNull();
    });

    it('KNOWN QUIRK: a wrong password for an existing account gets the GENERIC error message, not "E-Mail oder Passwort falsch." — the Auth Emulator raises the legacy `auth/wrong-password`, but getFriendlyErrorMessage() only special-cases the newer unified `auth/invalid-credential`', async () => {
      const email = `wrongpass-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, email, 'CorrectPassword1!');
      await signOut(auth);
      const service = createService();

      const promise = service.logInWithEmailAndPassword(email, 'ThisIsWrong1!');
      expect(service.isLoading()).toBeTrue();
      await promise;

      expect(service.isLoading()).toBeFalse();
      expect(service.errorMessage()).toBe('Ein unerwarteter Fehler ist aufgetreten.');
      expect(navigationService.gotToChat).not.toHaveBeenCalled();
      expect(notificationService.success).not.toHaveBeenCalled();
    });

    it('KNOWN QUIRK: a non-existent account gets the GENERIC error message too — the emulator raises the legacy `auth/user-not-found`, which is also not one of the two codes getFriendlyErrorMessage() special-cases', async () => {
      const service = createService();

      await service.logInWithEmailAndPassword('no-such-account@test.local', 'whatever123');

      expect(service.errorMessage()).toBe('Ein unerwarteter Fehler ist aufgetreten.');
    });

    it('directly maps the auth/invalid-credential code to the friendly "wrong credentials" message (the mapping itself is correct — it is just unreachable via the real Auth Emulator/legacy codes above)', () => {
      const service = createService();
      const message = (service as any).getFriendlyErrorMessage('auth/invalid-credential');
      expect(message).toBe('E-Mail oder Passwort falsch.');
    });

    it('directly maps the auth/network-request-failed code to the friendly network error message', () => {
      const service = createService();
      const message = (service as any).getFriendlyErrorMessage('auth/network-request-failed');
      expect(message).toBe('Netzwerkfehler. Prüfe deinen Adblocker.');
    });

    it('failure: falls back to the generic message for an unrecognized error code (e.g. auth/invalid-email)', async () => {
      const service = createService();

      await service.logInWithEmailAndPassword('not-a-valid-email', 'whatever123');

      expect(service.isLoading()).toBeFalse();
      expect(service.errorMessage()).toBe('Ein unerwarteter Fehler ist aufgetreten.');
    });
  });

  // ---------------------------------------------------------------------
  // loginAsGuest
  // ---------------------------------------------------------------------
  describe('loginAsGuest', () => {
    it('signs the existing guest account in directly when it already exists', async () => {
      await createUserWithEmailAndPassword(auth, GUEST_EMAIL, 'Gast1234');
      await signOut(auth);
      const service = createService();

      const promise = service.loginAsGuest();
      expect(service.isLoading()).toBeTrue();
      await promise;
      expect(service.isLoading()).toBeFalse();

      expect(fireService.createUser).toHaveBeenCalled();
      const createdUser = fireService.createUser.calls.mostRecent().args[0];
      expect(createdUser.email).toBe(GUEST_EMAIL);
      expect(createdUser.displayName).toBe('Gast-Besucher');
      expect(fireService.addChannelMembers).toHaveBeenCalledWith(DEFAULT_CHANNEL_ID, [{ id: createdUser.id }]);
      expect(notificationService.success).toHaveBeenCalledWith('Erfolgreich angemeldet!');
      expect(navigationService.gotToChat).toHaveBeenCalled();
    });

    it('falls through to account creation when sign-in fails with user-not-found/invalid-credential (no guest account yet)', async () => {
      const service = createService(); // no guest account has been created in this test

      await service.loginAsGuest();

      expect(service.isLoading()).toBeFalse();
      expect(fireService.createUser).toHaveBeenCalled();
      const createdUser = fireService.createUser.calls.mostRecent().args[0];
      expect(createdUser.email).toBe(GUEST_EMAIL);
      expect(fireService.addChannelMembers).toHaveBeenCalledWith(DEFAULT_CHANNEL_ID, [{ id: createdUser.id }]);
      expect(notificationService.success).toHaveBeenCalledWith('Erfolgreich angemeldet!');
      expect(navigationService.gotToChat).toHaveBeenCalled();
    });

    it('other errors (e.g. auth/user-disabled) short-circuit without attempting account creation', async () => {
      const credential = await createUserWithEmailAndPassword(auth, GUEST_EMAIL, 'Gast1234');
      await disableAuthUser(credential.user.uid);
      await signOut(auth);
      const service = createService();

      await service.loginAsGuest();

      expect(service.isLoading()).toBeFalse();
      expect(fireService.createUser).not.toHaveBeenCalled();
      expect(navigationService.gotToChat).not.toHaveBeenCalled();
      expect(service.errorMessage()).toBe('Ein unerwarteter Fehler ist aufgetreten.');
    });
  });

  // ---------------------------------------------------------------------
  // logInWithGoogle — COVERAGE LIMITATION, see the `pending()` spec below
  // for the full explanation. Both interception strategies were tried and
  // both failed for real in this project's webpack/karma build:
  //   - `spyOn(angularFireAuth, 'signInWithPopup')` -> "is not declared
  //     writable or has no setter"
  //   - `Object.defineProperty(angularFireAuth, 'signInWithPopup', ...)`
  //     -> "TypeError: Cannot redefine property: signInWithPopup"
  // A real (unmocked) signInWithPopup() call was also tried and observed to
  // hang indefinitely in headless Chrome (no popup can open, but it never
  // rejects either) rather than fail fast, ruling out a "real failure path"
  // test the way updateOnlineStatus/updateDoc failures were tested elsewhere
  // in this task. AuthService's error-branch LOGIC (the `auth/network-
  // request-failed` special case vs. the generic fallback) is still fully
  // exercised indirectly: `getFriendlyErrorMessage()` is covered by the
  // direct-call tests in the logInWithEmailAndPassword block above, and the
  // extra console.error for network errors is identical code to what those
  // tests exercise conceptually — only the signInWithPopup call site itself
  // (and the success-path Firestore-sync branch) is left untested.
  // ---------------------------------------------------------------------
  describe('logInWithGoogle', () => {
    it('cannot be exercised for real or via mocking in this build — see comment above', () => {
      pending(
        'signInWithPopup() needs a real Google OAuth popup (not emulator-testable, and a real call hangs ' +
          "indefinitely rather than reject in headless Chrome) and this bundle's re-exported " +
          "'@angular/fire/auth' bindings are non-writable AND non-configurable, so neither spyOn() nor " +
          'Object.defineProperty() can intercept the call either. See auth.service.spec.ts for details.',
      );
    });
  });

  // ---------------------------------------------------------------------
  // completeRegistration
  // ---------------------------------------------------------------------
  describe('completeRegistration', () => {
    it('is a no-op error path when no step-1 data was ever set', async () => {
      const service = createService();

      await service.completeRegistration('photo.png');

      // KNOWN QUIRK: handleRegError() always reads `error.code`, but this
      // call site passes a raw string ('Keine Daten gefunden') instead of an
      // Error-like object. `'a string'.code` is undefined, so the specific
      // message is silently discarded and the generic fallback is shown
      // instead of anything mentioning "Keine Daten gefunden".
      expect(service.errorMessage()).toBe('Ein unerwarteter Fehler ist aufgetreten.');
      expect(fireService.createUser).not.toHaveBeenCalled();
    });

    it('success: creates the Firebase Auth user, updates the profile, syncs Firestore, joins the default channel and navigates', async () => {
      const service = createService();
      const email = `register-${Date.now()}@test.local`;
      const data: RegisterData = { email, password: 'Password123!', displayName: 'New Person', photoUrl: 'unused.png', online: false };
      service.setStep1Data(data);

      const promise = service.completeRegistration('avatar_3.png');
      expect(service.isLoading()).toBeTrue();
      await promise;
      expect(service.isLoading()).toBeFalse();

      expect(auth.currentUser?.email).toBe(email);
      expect(auth.currentUser?.displayName).toBe('New Person');

      expect(fireService.createUser).toHaveBeenCalled();
      const createdUser = fireService.createUser.calls.mostRecent().args[0];
      expect(createdUser.displayName).toBe('New Person');
      expect(createdUser.photoUrl).toBe('avatar_3.png');
      expect(fireService.addChannelMembers).toHaveBeenCalledWith(DEFAULT_CHANNEL_ID, [{ id: createdUser.id }]);
      expect(notificationService.success).toHaveBeenCalledWith('Konto erfolgreich erstellt!');
      expect(navigationService.gotToChat).toHaveBeenCalled();
      expect(service.getUserName()).toBeUndefined(); // tempUserData cleared
    });

    it('failure: sets the generic error message when account creation fails (e.g. email already in use) and resets isLoading', async () => {
      const email = `register-dupe-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, email, 'Password123!');
      await signOut(auth);

      const service = createService();
      service.setStep1Data({ email, password: 'Password123!', displayName: 'Dup', photoUrl: '', online: false });

      await service.completeRegistration('photo.png');

      expect(service.isLoading()).toBeFalse();
      expect(service.errorMessage()).toBe('Ein unerwarteter Fehler ist aufgetreten.');
      expect(fireService.createUser).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // logOut
  // ---------------------------------------------------------------------
  describe('logOut', () => {
    // NOTE: the constructor's own onAuthStateChanged listener (see the
    // "listener wiring" describe below) ALSO writes to userStoreMock as an
    // ambient side effect of createService() whenever a real user is
    // signed in. Every test here waits for that first ambient write to
    // settle before setting its own precondition, otherwise the two race.
    it('when a current user is set, marks it offline before signing out and navigating to login', async () => {
      const email = `logout-${Date.now()}@test.local`;
      const credential = await createUserWithEmailAndPassword(auth, email, 'Password123!');
      const service = createService();
      await waitFor(() => userStoreMock.setCurrentUser.calls.count() > 0);
      userStoreMock.setCurrentUser({ id: credential.user.uid, email, displayName: 'X', photoUrl: '', online: true });
      fireService.updateOnlineStatus.calls.reset();

      const promise = service.logOut();
      expect(service.isLoading()).toBeTrue();
      await promise;
      expect(service.isLoading()).toBeFalse();

      expect(fireService.updateOnlineStatus).toHaveBeenCalledWith(jasmine.objectContaining({ id: credential.user.uid, online: false }));
      expect(auth.currentUser).toBeNull();
      expect(navigationService.goToLogin).toHaveBeenCalled();
    });

    it('when there is no current user, skips updateOnlineStatus but still signs out and navigates to login', async () => {
      const email = `logout-nouser-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, email, 'Password123!');
      const service = createService();
      await waitFor(() => userStoreMock.setCurrentUser.calls.count() > 0);
      userStoreMock.setCurrentUser(null); // explicitly represent "no current user" in the store
      fireService.updateOnlineStatus.calls.reset();

      await service.logOut();

      expect(fireService.updateOnlineStatus).not.toHaveBeenCalled();
      expect(auth.currentUser).toBeNull();
      expect(navigationService.goToLogin).toHaveBeenCalled();
      expect(service.isLoading()).toBeFalse();
    });
  });

  // ---------------------------------------------------------------------
  // updateUserProfile
  // ---------------------------------------------------------------------
  describe('updateUserProfile', () => {
    // Same ambient-listener-settling concern as logOut above.
    it('is a no-op when auth.currentUser is null', async () => {
      const service = createService();
      await waitFor(() => userStoreMock.setCurrentUser.calls.count() > 0); // let the ambient onAuthStateChanged(null) settle
      userStoreMock.setCurrentUser.calls.reset();

      await service.updateUserProfile('New Name', 'new.png');

      expect(fireService.updateUser).not.toHaveBeenCalled();
      expect(userStoreMock.setCurrentUser).not.toHaveBeenCalled();
    });

    it('updates the Firebase profile, Firestore doc, and merges into the current userStore user when one is set', async () => {
      const email = `profile-${Date.now()}@test.local`;
      const credential = await createUserWithEmailAndPassword(auth, email, 'Password123!');
      const service = createService();
      await waitFor(() => userStoreMock.setCurrentUser.calls.count() > 0);
      userStoreMock.setCurrentUser({ id: credential.user.uid, email, displayName: 'Old', photoUrl: 'old.png', online: true });
      userStoreMock.setCurrentUser.calls.reset();

      await service.updateUserProfile('New Name', 'new.png');

      expect(auth.currentUser?.displayName).toBe('New Name');
      expect(fireService.updateUser).toHaveBeenCalledWith(credential.user.uid, { displayName: 'New Name', photoUrl: 'new.png' });
      expect(userStoreMock.setCurrentUser).toHaveBeenCalledWith(
        jasmine.objectContaining({ id: credential.user.uid, displayName: 'New Name', photoUrl: 'new.png', online: true }),
      );
    });

    it('sets userStore.currentUser to null (not a merge) when there was no current user, even though the update itself succeeded', async () => {
      const email = `profile-nouser-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, email, 'Password123!');
      const service = createService();
      await waitFor(() => userStoreMock.setCurrentUser.calls.count() > 0);
      userStoreMock.setCurrentUser(null); // explicitly represent "no current user" in the store
      userStoreMock.setCurrentUser.calls.reset();

      await service.updateUserProfile('New Name', 'new.png');

      expect(fireService.updateUser).toHaveBeenCalled();
      expect(userStoreMock.setCurrentUser).toHaveBeenCalledWith(null);
    });
  });

  // ---------------------------------------------------------------------
  // constructor / setCurrentUser onAuthStateChanged listener wiring
  // ---------------------------------------------------------------------
  describe('onAuthStateChanged-driven listener wiring', () => {
    it('when a user is already signed in at construction time, sets userStore.currentUser and attaches a subUserDoc listener', async () => {
      const email = `wiring-${Date.now()}@test.local`;
      const credential = await createUserWithEmailAndPassword(auth, email, 'Password123!');
      createService();

      await waitFor(() => fireService.subUserDoc.calls.count() > 0);

      expect(userStoreMock.setCurrentUser).toHaveBeenCalledWith(jasmine.objectContaining({ id: credential.user.uid, email }));
      expect(fireService.subUserDoc).toHaveBeenCalledWith(credential.user.uid, jasmine.any(Function));
    });

    it('when signed out at construction time, clears userStore.currentUser and does not attach a listener', async () => {
      createService();

      await waitFor(() => userStoreMock.setCurrentUser.calls.count() > 0);

      expect(userStoreMock.setCurrentUser).toHaveBeenCalledWith(null);
      expect(fireService.subUserDoc).not.toHaveBeenCalled();
    });

    it('detaches the previous subUserDoc listener when the auth state fires again for a different user', async () => {
      const unsubA = jasmine.createSpy('unsubA');
      const unsubB = jasmine.createSpy('unsubB');
      fireService.subUserDoc.and.returnValues(unsubA, unsubB);

      const emailA = `wiring-a-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, emailA, 'Password123!');
      createService();
      await waitFor(() => fireService.subUserDoc.calls.count() >= 1);
      expect(unsubA).not.toHaveBeenCalled();

      const emailB = `wiring-b-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, emailB, 'Password123!'); // signs in as B, firing onAuthStateChanged again

      await waitFor(() => fireService.subUserDoc.calls.count() >= 2);
      expect(unsubA).toHaveBeenCalled();
    });

    it('a firestoreData push from the subUserDoc callback overwrites userStore.currentUser with the Firestore doc', async () => {
      let capturedCallback: ((user: User | null) => void) | undefined;
      fireService.subUserDoc.and.callFake((_userId: string, callback: (user: User | null) => void) => {
        capturedCallback = callback;
        return jasmine.createSpy('unsub');
      });

      const email = `wiring-push-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, email, 'Password123!');
      createService();
      await waitFor(() => !!capturedCallback);

      userStoreMock.setCurrentUser.calls.reset();
      const firestoreUser: User = { id: 'firestore-id', email: 'from-firestore@test.local', displayName: 'From Firestore', photoUrl: '', online: true };
      capturedCallback!(firestoreUser);

      expect(userStoreMock.setCurrentUser).toHaveBeenCalledWith(firestoreUser);
    });

    it('a null firestoreData push from the subUserDoc callback does NOT overwrite userStore.currentUser', async () => {
      let capturedCallback: ((user: User | null) => void) | undefined;
      fireService.subUserDoc.and.callFake((_userId: string, callback: (user: User | null) => void) => {
        capturedCallback = callback;
        return jasmine.createSpy('unsub');
      });

      const email = `wiring-nullpush-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, email, 'Password123!');
      createService();
      await waitFor(() => !!capturedCallback);

      userStoreMock.setCurrentUser.calls.reset();
      capturedCallback!(null);

      expect(userStoreMock.setCurrentUser).not.toHaveBeenCalled();
    });
  });

  // ---------------------------------------------------------------------
  // Password-reset pass-through wrappers (thin wrappers around Auth SDK
  // calls — round-tripped against the real emulator, including retrieving
  // the real oobCode via the emulator's REST surface).
  // ---------------------------------------------------------------------
  describe('password reset wrappers', () => {
    it('sendPasswordReset resolves for an existing account', async () => {
      const email = `reset-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, email, 'Password123!');
      await signOut(auth);
      const service = createService();

      await expectAsync(service.sendPasswordReset(email)).toBeResolved();
    });

    it('verifyPasswordResetCode + confirmPasswordReset complete a real reset round-trip via the emulator oobCode', async () => {
      const email = `reset-flow-${Date.now()}@test.local`;
      await createUserWithEmailAndPassword(auth, email, 'Password123!');
      await signOut(auth);
      const service = createService();

      await service.sendPasswordReset(email);

      const oobRes = await fetch(`http://localhost:9099/emulator/v1/projects/${EMULATOR_PROJECT_ID}/oobCodes`);
      const { oobCodes } = await oobRes.json();
      const resetCode = oobCodes.find((c: any) => c.email === email && c.requestType === 'PASSWORD_RESET');
      expect(resetCode).toBeDefined();

      const verifiedEmail = await service.verifyPasswordResetCode(resetCode.oobCode);
      expect(verifiedEmail).toBe(email);

      await service.confirmPasswordReset(resetCode.oobCode, 'NewPassword456!');

      await expectAsync(signInWithEmailAndPassword(auth, email, 'NewPassword456!')).toBeResolved();
    });

    it('verifyPasswordResetCode rejects for a malformed/unknown code', async () => {
      const service = createService();
      await expectAsync(service.verifyPasswordResetCode('not-a-real-code')).toBeRejected();
    });
  });
});
