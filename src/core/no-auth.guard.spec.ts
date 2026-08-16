import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { FirebaseApp, getApps, initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { Auth, connectAuthEmulator, createUserWithEmailAndPassword, getAuth, provideAuth, signOut } from '@angular/fire/auth';
import { EMULATOR_PROJECT_ID, wipeAuthEmulator } from '../testing/firestore-mock.util';
import { noAuthGuard } from './no-auth.guard';

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

describe('noAuthGuard', () => {
  let auth: Auth;
  let router: jasmine.SpyObj<Router>;

  beforeAll(() => {
    jasmine.DEFAULT_TIMEOUT_INTERVAL = 15000;
  });

  beforeEach(() => {
    router = jasmine.createSpyObj<Router>('Router', ['navigate']);
    TestBed.configureTestingModule({
      providers: [provideFirebaseApp(() => sharedTestApp()), provideAuth(() => sharedTestAuth()), { provide: Router, useValue: router }],
    });
    auth = TestBed.inject(Auth);
  });

  afterEach(async () => {
    if (auth.currentUser) await signOut(auth);
    await wipeAuthEmulator();
  });

  it('resolves false and navigates to /main when a user is signed in', async () => {
    const email = `noguard-test-${Date.now()}@test.local`;
    await createUserWithEmailAndPassword(auth, email, 'Password123!');

    const result = await TestBed.runInInjectionContext(() => noAuthGuard({} as any, {} as any));

    expect(result).toBeFalse();
    expect(router.navigate).toHaveBeenCalledWith(['/main']);
  });

  it('resolves true and does not navigate when no user is signed in', async () => {
    const result = await TestBed.runInInjectionContext(() => noAuthGuard({} as any, {} as any));

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });

  it('resolves true and does not navigate after the signed-in user signs out', async () => {
    const email = `noguard-test-${Date.now()}@test.local`;
    await createUserWithEmailAndPassword(auth, email, 'Password123!');
    await signOut(auth);

    const result = await TestBed.runInInjectionContext(() => noAuthGuard({} as any, {} as any));

    expect(result).toBeTrue();
    expect(router.navigate).not.toHaveBeenCalled();
  });
});
