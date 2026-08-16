import { isChannel, isUser } from './receiver.util';
import { Channel } from '../../features/channel/models/channel/channel';
import { User } from '../../features/auth/models/user/user';

describe('isChannel / isUser', () => {
  const channel: Channel = {
    id: 'c1',
    name: 'Allgemein',
    description: '',
    member: [{ id: 'u1' }],
    createdAt: new Date(),
    createdBy: 'u1',
  };

  const user: User = {
    id: 'u1',
    email: 'a@b.de',
    displayName: 'Alice',
    photoUrl: '',
    online: true,
  };

  describe('isChannel', () => {
    it('returns true for a Channel (has a member array)', () => {
      expect(isChannel(channel)).toBeTrue();
    });

    it('returns false for a User', () => {
      expect(isChannel(user)).toBeFalse();
    });

    it('returns false for null/undefined', () => {
      expect(isChannel(null)).toBeFalse();
      expect(isChannel(undefined)).toBeFalse();
    });
  });

  describe('isUser', () => {
    it('returns true for a User (has displayName)', () => {
      expect(isUser(user)).toBeTrue();
    });

    it('returns false for a Channel', () => {
      expect(isUser(channel)).toBeFalse();
    });

    it('returns false for null/undefined', () => {
      expect(isUser(null)).toBeFalse();
      expect(isUser(undefined)).toBeFalse();
    });
  });
});
