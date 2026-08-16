import { TestBed } from '@angular/core/testing';
import { ReactionsService, ReactionContext } from './reactions.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { UserStore } from '../../../../shared/services/user/user-store';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { makeUser } from '../../../../../testing/user-fixtures';
import { makeChannelMessage } from '../../../../../testing/message-fixtures';
import { Reaction } from '../../models/channel-message/channel-message';
import { User } from '../../../auth/models/user/user';

describe('ReactionsService', () => {
  let service: ReactionsService;
  let fireServiceSpy: jasmine.SpyObj<FireServiceService>;
  let currentUserSignal: ReturnType<typeof mockSignal<User | null>>;
  const context: ReactionContext = { channelId: 'chan-1' };

  beforeEach(() => {
    fireServiceSpy = jasmine.createSpyObj<FireServiceService>('FireServiceService', ['updateReaction', 'getMessageRefForContext']);
    (fireServiceSpy as any).allUsers = mockSignal<User[]>([]);

    currentUserSignal = mockSignal<User | null>(null);
    const userStoreMock = { currentUser: currentUserSignal } as unknown as UserStore;

    TestBed.configureTestingModule({
      providers: [
        { provide: FireServiceService, useValue: fireServiceSpy },
        { provide: UserStore, useValue: userStoreMock },
      ],
    });
    service = TestBed.inject(ReactionsService);
  });

  describe('hasReacted() [pure]', () => {
    it('is true when the current user has a reaction with this emoji', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      const reactions: Reaction[] = [{ emoji: '👍', from: 'me' }];
      expect(service.hasReacted('👍', reactions)).toBeTrue();
    });

    it('is false when the current user reacted with a different emoji', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      const reactions: Reaction[] = [{ emoji: '👍', from: 'me' }];
      expect(service.hasReacted('🎉', reactions)).toBeFalse();
    });

    it('is false when someone else reacted with this emoji', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      const reactions: Reaction[] = [{ emoji: '👍', from: 'someone-else' }];
      expect(service.hasReacted('👍', reactions)).toBeFalse();
    });

    it('falls back to "n/a" as the current user id when there is no current user', () => {
      currentUserSignal.set(null);
      const reactions: Reaction[] = [{ emoji: '👍', from: 'n/a' }];
      expect(service.hasReacted('👍', reactions)).toBeTrue();
    });

    it('is false for an empty reactions array', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      expect(service.hasReacted('👍', [])).toBeFalse();
    });
  });

  describe('uniqueEmojis() [pure]', () => {
    it('keeps only the first occurrence of each emoji, preserving order', () => {
      const reactions: Reaction[] = [
        { emoji: '👍', from: 'a' },
        { emoji: '🎉', from: 'b' },
        { emoji: '👍', from: 'c' },
      ];
      expect(service.uniqueEmojis(reactions)).toEqual([
        { emoji: '👍', from: 'a' },
        { emoji: '🎉', from: 'b' },
      ]);
    });

    it('returns an empty array for an empty input', () => {
      expect(service.uniqueEmojis([])).toEqual([]);
    });

    it('returns all entries when every emoji is already unique', () => {
      const reactions: Reaction[] = [
        { emoji: '👍', from: 'a' },
        { emoji: '🎉', from: 'b' },
      ];
      expect(service.uniqueEmojis(reactions)).toEqual(reactions);
    });
  });

  describe('countEmoji() [pure]', () => {
    it('counts matching entries', () => {
      const reactions: Reaction[] = [
        { emoji: '👍', from: 'a' },
        { emoji: '👍', from: 'b' },
        { emoji: '🎉', from: 'c' },
      ];
      expect(service.countEmoji('👍', reactions)).toBe(2);
    });

    it('returns 0 for an emoji not present', () => {
      expect(service.countEmoji('🎉', [{ emoji: '👍', from: 'a' }])).toBe(0);
    });

    it('returns 0 for an empty array', () => {
      expect(service.countEmoji('👍', [])).toBe(0);
    });
  });

  describe('countUniqueEmojis() [pure]', () => {
    it('counts the number of distinct emojis', () => {
      const reactions: Reaction[] = [
        { emoji: '👍', from: 'a' },
        { emoji: '👍', from: 'b' },
        { emoji: '🎉', from: 'c' },
      ];
      expect(service.countUniqueEmojis(reactions)).toBe(2);
    });

    it('returns 0 for an empty array', () => {
      expect(service.countUniqueEmojis([])).toBe(0);
    });
  });

  describe('getReactionNamesForEmoji() [pure logic against a mocked allUsers signal]', () => {
    it('returns ["Du"] when only the current user reacted', () => {
      const me = makeUser({ id: 'me', displayName: 'Ich' });
      currentUserSignal.set(me);
      (fireServiceSpy.allUsers as any).set([me]);
      const reactions: Reaction[] = [{ emoji: '👍', from: 'me' }];

      expect(service.getReactionNamesForEmoji('👍', reactions)).toEqual(['Du']);
    });

    it('appends "und du" after other names when the current user also reacted', () => {
      const me = makeUser({ id: 'me', displayName: 'Ich' });
      const alice = makeUser({ id: 'alice', displayName: 'Alice' });
      currentUserSignal.set(me);
      (fireServiceSpy.allUsers as any).set([me, alice]);
      const reactions: Reaction[] = [
        { emoji: '👍', from: 'alice' },
        { emoji: '👍', from: 'me' },
      ];

      expect(service.getReactionNamesForEmoji('👍', reactions)).toEqual(['Alice', 'und du']);
    });

    it('returns a plain comma-joinable name list when the current user did not react', () => {
      const me = makeUser({ id: 'me', displayName: 'Ich' });
      const alice = makeUser({ id: 'alice', displayName: 'Alice' });
      const bob = makeUser({ id: 'bob', displayName: 'Bob' });
      currentUserSignal.set(me);
      (fireServiceSpy.allUsers as any).set([me, alice, bob]);
      const reactions: Reaction[] = [
        { emoji: '👍', from: 'alice' },
        { emoji: '👍', from: 'bob' },
      ];

      expect(service.getReactionNamesForEmoji('👍', reactions)).toEqual(['Alice', 'Bob']);
    });

    it('returns an empty array when nobody reacted with this emoji', () => {
      const me = makeUser({ id: 'me' });
      currentUserSignal.set(me);
      (fireServiceSpy.allUsers as any).set([me]);

      expect(service.getReactionNamesForEmoji('👍', [])).toEqual([]);
    });

    it('excludes reactions for a different emoji', () => {
      const me = makeUser({ id: 'me', displayName: 'Ich' });
      const alice = makeUser({ id: 'alice', displayName: 'Alice' });
      currentUserSignal.set(me);
      (fireServiceSpy.allUsers as any).set([me, alice]);
      const reactions: Reaction[] = [{ emoji: '🎉', from: 'alice' }];

      expect(service.getReactionNamesForEmoji('👍', reactions)).toEqual([]);
    });
  });

  describe('toggleReaction()', () => {
    it('adds the reaction and persists it when the user has not reacted yet', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      const message = makeChannelMessage({ reaction: [] });
      const ref = { id: 'ref' } as any;
      fireServiceSpy.getMessageRefForContext.and.returnValue(ref);

      service.toggleReaction(message, '👍', context);

      expect(message.reaction).toEqual([{ emoji: '👍', from: 'me' }]);
      expect(fireServiceSpy.updateReaction).toHaveBeenCalledWith(ref, message.reaction);
    });

    it('removes the reaction and persists it when the user already reacted with this emoji', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      const message = makeChannelMessage({ reaction: [{ emoji: '👍', from: 'me' }] });
      const ref = { id: 'ref' } as any;
      fireServiceSpy.getMessageRefForContext.and.returnValue(ref);

      service.toggleReaction(message, '👍', context);

      expect(message.reaction).toEqual([]);
      expect(fireServiceSpy.updateReaction).toHaveBeenCalledWith(ref, message.reaction);
    });

    it('does not persist when adding a reaction but the message ref cannot be resolved', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      const message = makeChannelMessage({ reaction: [] });
      fireServiceSpy.getMessageRefForContext.and.returnValue(null);

      service.toggleReaction(message, '👍', context);

      expect(message.reaction).toEqual([{ emoji: '👍', from: 'me' }]);
      expect(fireServiceSpy.updateReaction).not.toHaveBeenCalled();
    });
  });

  describe('removeReaction()', () => {
    it('removes the matching reaction and persists it', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      const message = makeChannelMessage({
        reaction: [
          { emoji: '👍', from: 'me' },
          { emoji: '🎉', from: 'other' },
        ],
      });
      const ref = { id: 'ref' } as any;
      fireServiceSpy.getMessageRefForContext.and.returnValue(ref);

      service.removeReaction(message, '👍', context);

      expect(message.reaction).toEqual([{ emoji: '🎉', from: 'other' }]);
      expect(fireServiceSpy.updateReaction).toHaveBeenCalledWith(ref, message.reaction);
    });

    it('is a no-op when the current user has no reaction with this emoji', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      const message = makeChannelMessage({ reaction: [{ emoji: '🎉', from: 'other' }] });

      service.removeReaction(message, '👍', context);

      expect(message.reaction).toEqual([{ emoji: '🎉', from: 'other' }]);
      expect(fireServiceSpy.updateReaction).not.toHaveBeenCalled();
      expect(fireServiceSpy.getMessageRefForContext).not.toHaveBeenCalled();
    });

    it('does not persist when the ref cannot be resolved, but still removes it locally', () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      const message = makeChannelMessage({ reaction: [{ emoji: '👍', from: 'me' }] });
      fireServiceSpy.getMessageRefForContext.and.returnValue(null);

      service.removeReaction(message, '👍', context);

      expect(message.reaction).toEqual([]);
      expect(fireServiceSpy.updateReaction).not.toHaveBeenCalled();
    });
  });
});
