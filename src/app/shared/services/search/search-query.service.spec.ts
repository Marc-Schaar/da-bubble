import { TestBed } from '@angular/core/testing';
import { SearchQueryService } from './search-query.service';
import { FireServiceService } from '../firebase/fire-service.service';
import { makeUser } from '../../../../testing/user-fixtures';
import { makeChannel } from '../../../../testing/channel-fixtures';
import { mockSignal } from '../../../../testing/signal-service-mock.util';
import { Channel } from '../../../features/channel/models/channel/channel';
import { User } from '../../../features/auth/models/user/user';

describe('SearchQueryService', () => {
  let service: SearchQueryService;
  let fireServiceSpy: jasmine.SpyObj<FireServiceService> & { allUsers: (users?: User[]) => User[]; myChannels: (channels?: Channel[]) => Channel[] };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('FireServiceService', ['subAllUsers', 'subChannels']) as any;
    spy.allUsers = mockSignal<User[]>([]);
    spy.myChannels = mockSignal<Channel[]>([]);
    fireServiceSpy = spy;

    TestBed.configureTestingModule({
      providers: [{ provide: FireServiceService, useValue: fireServiceSpy }],
    });
    service = TestBed.inject(SearchQueryService);
  });

  describe('startSearch() common behaviour', () => {
    it('always calls fireService.subChannels()', () => {
      service.startSearch('anything', 'channel');
      expect(fireServiceSpy.subChannels).toHaveBeenCalled();
    });

    it('returns an empty array when searchCollection is omitted', () => {
      (fireServiceSpy.myChannels as any).set([makeChannel({ name: 'General' })]);
      const result = service.startSearch('gen');
      expect(result).toEqual([]);
    });

    it('does not call subAllUsers when searching channels', () => {
      service.startSearch('gen', 'channel');
      expect(fireServiceSpy.subAllUsers).not.toHaveBeenCalled();
    });
  });

  describe('startSearch(..., "channel")', () => {
    it('returns channels whose name contains the (lowercased) input', () => {
      const general = makeChannel({ name: 'General' });
      const random = makeChannel({ name: 'Random' });
      (fireServiceSpy.myChannels as any).set([general, random]);

      const result = service.startSearch('gen', 'channel');

      expect(result).toEqual([general]);
    });

    it('is case-insensitive on both the channel name and the input', () => {
      const general = makeChannel({ name: 'GeNeRaL' });
      (fireServiceSpy.myChannels as any).set([general]);

      const result = service.startSearch('GEN', 'channel');

      expect(result).toEqual([general]);
    });

    it('returns all channels for an empty query (every name includes "")', () => {
      const general = makeChannel({ name: 'General' });
      const random = makeChannel({ name: 'Random' });
      (fireServiceSpy.myChannels as any).set([general, random]);

      const result = service.startSearch('', 'channel');

      expect(result).toEqual([general, random]);
    });

    it('trims surrounding whitespace from the input before matching', () => {
      const general = makeChannel({ name: 'General' });
      (fireServiceSpy.myChannels as any).set([general]);

      const result = service.startSearch('  gen  ', 'channel');

      expect(result).toEqual([general]);
    });

    it('returns an empty array when nothing matches', () => {
      (fireServiceSpy.myChannels as any).set([makeChannel({ name: 'General' })]);

      const result = service.startSearch('zzz', 'channel');

      expect(result).toEqual([]);
    });

    it('returns an empty array when there are no channels to search', () => {
      (fireServiceSpy.myChannels as any).set([]);

      const result = service.startSearch('gen', 'channel');

      expect(result).toEqual([]);
    });
  });

  describe('startSearch(..., "user")', () => {
    it('returns members of the searched channels whose displayName matches', () => {
      const alice = makeUser({ id: 'u1', displayName: 'Alice' });
      const bob = makeUser({ id: 'u2', displayName: 'Bob' });
      const channel = makeChannel({ member: [{ id: 'u1' }, { id: 'u2' }] });
      (fireServiceSpy.myChannels as any).set([channel]);
      (fireServiceSpy.allUsers as any).set([alice, bob]);

      const result = service.startSearch('ali', 'user');

      expect(result).toEqual([alice]);
    });

    it('calls fireService.subAllUsers() when searching users', () => {
      service.startSearch('ali', 'user');
      expect(fireServiceSpy.subAllUsers).toHaveBeenCalled();
    });

    it('is case-insensitive on the displayName and the input', () => {
      const alice = makeUser({ id: 'u1', displayName: 'AlIcE' });
      const channel = makeChannel({ member: [{ id: 'u1' }] });
      (fireServiceSpy.myChannels as any).set([channel]);
      (fireServiceSpy.allUsers as any).set([alice]);

      const result = service.startSearch('ALI', 'user');

      expect(result).toEqual([alice]);
    });

    it('excludes users that match by name but are not members of any searched channel', () => {
      const alice = makeUser({ id: 'u1', displayName: 'Alice' });
      const outsider = makeUser({ id: 'u2', displayName: 'Alicia' });
      const channel = makeChannel({ member: [{ id: 'u1' }] });
      (fireServiceSpy.myChannels as any).set([channel]);
      (fireServiceSpy.allUsers as any).set([alice, outsider]);

      const result = service.startSearch('ali', 'user');

      expect(result).toEqual([alice]);
    });

    it('returns an empty array for an empty query, listing every member', () => {
      const alice = makeUser({ id: 'u1', displayName: 'Alice' });
      const bob = makeUser({ id: 'u2', displayName: 'Bob' });
      const channel = makeChannel({ member: [{ id: 'u1' }, { id: 'u2' }] });
      (fireServiceSpy.myChannels as any).set([channel]);
      (fireServiceSpy.allUsers as any).set([alice, bob]);

      const result = service.startSearch('', 'user');

      expect(result).toEqual([alice, bob]);
    });

    it('returns an empty array when there are no channels (no members to consider)', () => {
      (fireServiceSpy.myChannels as any).set([]);
      (fireServiceSpy.allUsers as any).set([makeUser({ id: 'u1', displayName: 'Alice' })]);

      const result = service.startSearch('ali', 'user');

      expect(result).toEqual([]);
    });

    it('returns an empty array when nothing matches', () => {
      const alice = makeUser({ id: 'u1', displayName: 'Alice' });
      const channel = makeChannel({ member: [{ id: 'u1' }] });
      (fireServiceSpy.myChannels as any).set([channel]);
      (fireServiceSpy.allUsers as any).set([alice]);

      const result = service.startSearch('zzz', 'user');

      expect(result).toEqual([]);
    });

    it('deduplicates members shared across multiple searched channels', () => {
      const alice = makeUser({ id: 'u1', displayName: 'Alice' });
      const channelA = makeChannel({ member: [{ id: 'u1' }] });
      const channelB = makeChannel({ member: [{ id: 'u1' }] });
      (fireServiceSpy.myChannels as any).set([channelA, channelB]);
      (fireServiceSpy.allUsers as any).set([alice]);

      const result = service.startSearch('ali', 'user');

      expect(result).toEqual([alice]);
    });

    it('accepts a channel member expressed as a raw string id (defensive typeof handling)', () => {
      const alice = makeUser({ id: 'u1', displayName: 'Alice' });
      const channel = { ...makeChannel(), member: ['u1'] } as unknown as Channel;
      (fireServiceSpy.myChannels as any).set([channel]);
      (fireServiceSpy.allUsers as any).set([alice]);

      const result = service.startSearch('ali', 'user');

      expect(result).toEqual([alice]);
    });

    it('falls back to an empty member list when a channel has no member array', () => {
      const channel = { ...makeChannel(), member: undefined } as unknown as Channel;
      (fireServiceSpy.myChannels as any).set([channel]);
      (fireServiceSpy.allUsers as any).set([makeUser({ id: 'u1', displayName: 'Alice' })]);

      expect(() => service.startSearch('ali', 'user')).not.toThrow();
      expect(service.startSearch('ali', 'user')).toEqual([]);
    });
  });
});
