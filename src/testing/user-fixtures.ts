import { User } from '../app/features/auth/models/user/user';

let counter = 0;

/** Builds a valid User test fixture, with sensible defaults and per-call overrides. */
export function makeUser(overrides: Partial<User> = {}): User {
  counter += 1;
  return {
    id: `user-${counter}`,
    email: `user${counter}@test.local`,
    displayName: `Test User ${counter}`,
    photoUrl: 'img/avatars/avatar_1.png',
    online: true,
    ...overrides,
  };
}
