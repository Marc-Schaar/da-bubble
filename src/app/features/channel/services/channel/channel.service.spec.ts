import { TestBed } from '@angular/core/testing';
import { ChannelService } from './channel.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { makeUser } from '../../../../../testing/user-fixtures';
import { makeChannel } from '../../../../../testing/channel-fixtures';
import { User } from '../../../auth/models/user/user';
import { Channel } from '../../models/channel/channel';

describe('ChannelService', () => {
  let service: ChannelService;
  let fireServiceSpy: jasmine.SpyObj<FireServiceService>;
  let allUsersSignal: ReturnType<typeof mockSignal<User[]>>;
  let currentUserSignal: ReturnType<typeof mockSignal<User | null>>;

  beforeEach(() => {
    fireServiceSpy = jasmine.createSpyObj<FireServiceService>('FireServiceService', [
      'subAllUsers',
      'subChannelDoc',
      'addChannel',
      'updateChannelData',
      'addChannelMembers',
      'findChannelByName',
      'leaveChannel',
    ]);
    allUsersSignal = mockSignal<User[]>([]);
    (fireServiceSpy as any).allUsers = allUsersSignal;

    currentUserSignal = mockSignal<User | null>(null);
    const authServiceMock = { currentUser: currentUserSignal } as unknown as AuthService;

    TestBed.configureTestingModule({
      providers: [
        { provide: FireServiceService, useValue: fireServiceSpy },
        { provide: AuthService, useValue: authServiceMock },
      ],
    });
    service = TestBed.inject(ChannelService);
  });

  it('subscribes to all users on construction', () => {
    expect(fireServiceSpy.subAllUsers).toHaveBeenCalled();
  });

  describe('enrichedMembers', () => {
    it('is empty when there is no current channel', () => {
      expect(service.enrichedMembers()).toEqual([]);
    });

    it('enriches a member with the live user data, keeping the member id as a string', () => {
      const liveUser = makeUser({ id: '42', displayName: 'Alice' });
      allUsersSignal.set([liveUser]);
      service.currentChannel.set(makeChannel({ member: [{ id: '42' }] }));

      expect(service.enrichedMembers()).toEqual([{ ...liveUser, id: '42' }]);
    });

    it('falls back to a placeholder user when the member is not found in allUsers', () => {
      allUsersSignal.set([]);
      service.currentChannel.set(makeChannel({ member: [{ id: 'ghost' }] }));

      expect(service.enrichedMembers()).toEqual([
        {
          id: 'ghost',
          displayName: 'Unbekannter Nutzer',
          photoUrl: 'assets/img/avatar.png',
          online: false,
          email: '',
        } as any,
      ]);
    });

    it('handles a channel with no members', () => {
      service.currentChannel.set(makeChannel({ member: [] }));
      expect(service.enrichedMembers()).toEqual([]);
    });
  });

  describe('creatorName', () => {
    it('is empty when there is no current channel', () => {
      expect(service.creatorName()).toBe('');
    });

    it('is empty when the channel has no createdBy', () => {
      service.currentChannel.set(makeChannel({ createdBy: '' }));
      expect(service.creatorName()).toBe('');
    });

    it("returns the creator's displayName when found", () => {
      const creator = makeUser({ id: 'c1', displayName: 'Creator Chris' });
      allUsersSignal.set([creator]);
      service.currentChannel.set(makeChannel({ createdBy: 'c1' }));

      expect(service.creatorName()).toBe('Creator Chris');
    });

    it('falls back to "Unbekannter Nutzer" when the creator is not found', () => {
      allUsersSignal.set([]);
      service.currentChannel.set(makeChannel({ createdBy: 'missing' }));

      expect(service.creatorName()).toBe('Unbekannter Nutzer');
    });
  });

  describe('filteredUsers', () => {
    it('excludes users who are already members of the current channel', () => {
      const member = makeUser({ id: 'm1', displayName: 'Member', email: 'm@test.local' });
      allUsersSignal.set([member]);
      service.currentChannel.set(makeChannel({ member: [{ id: 'm1' }] }));

      expect(service.filteredUsers()).toEqual([]);
    });

    it('excludes users already in the selectedUsers list', () => {
      const candidate = makeUser({ id: 'sel1', displayName: 'Selected', email: 's@test.local' });
      allUsersSignal.set([candidate]);
      service.currentChannel.set(makeChannel({ member: [] }));
      service.selectedUsers.set([candidate]);

      expect(service.filteredUsers()).toEqual([]);
    });

    it('excludes the current user', () => {
      const me = makeUser({ id: 'me', displayName: 'Me', email: 'me@test.local' });
      allUsersSignal.set([me]);
      currentUserSignal.set(me);
      service.currentChannel.set(makeChannel({ member: [] }));

      expect(service.filteredUsers()).toEqual([]);
    });

    it('excludes users without an email', () => {
      const noEmail = makeUser({ id: 'n1', displayName: 'NoEmail', email: '' });
      allUsersSignal.set([noEmail]);
      service.currentChannel.set(makeChannel({ member: [] }));

      expect(service.filteredUsers()).toEqual([]);
    });

    it('excludes users whose displayName does not match the search query', () => {
      const other = makeUser({ id: 'o1', displayName: 'Other', email: 'o@test.local' });
      allUsersSignal.set([other]);
      service.currentChannel.set(makeChannel({ member: [] }));
      service.updateSearchQuery('zzz');

      expect(service.filteredUsers()).toEqual([]);
    });

    it('matches the query case-insensitively', () => {
      const candidate = makeUser({ id: 'x1', displayName: 'Charlie', email: 'c@test.local' });
      allUsersSignal.set([candidate]);
      service.currentChannel.set(makeChannel({ member: [] }));
      service.updateSearchQuery('CHAR');

      expect(service.filteredUsers()).toEqual([candidate]);
    });

    it('includes a user who passes every filter', () => {
      const candidate = makeUser({ id: 'x2', displayName: 'Dana', email: 'd@test.local' });
      allUsersSignal.set([candidate]);
      service.currentChannel.set(makeChannel({ member: [] }));

      expect(service.filteredUsers()).toEqual([candidate]);
    });
  });

  describe('membersToSubmit', () => {
    it('maps all users to {id} when allMembersSelected is true', () => {
      const a = makeUser({ id: 'a' });
      const b = makeUser({ id: 'b' });
      allUsersSignal.set([a, b]);
      service.allMembersSelected.set(true);

      expect(service.membersToSubmit()).toEqual([{ id: 'a' }, { id: 'b' }]);
    });

    it('maps the selectedUsers to {id} and appends the current user if missing', () => {
      const selected = makeUser({ id: 's1' });
      const me = makeUser({ id: 'me' });
      currentUserSignal.set(me);
      service.selectedUsers.set([selected]);

      expect(service.membersToSubmit()).toEqual([{ id: 's1' }, { id: 'me' }]);
    });

    it('does not duplicate the current user when already selected', () => {
      const me = makeUser({ id: 'me' });
      currentUserSignal.set(me);
      service.selectedUsers.set([me]);

      expect(service.membersToSubmit()).toEqual([{ id: 'me' }]);
    });

    it('does not append a current user when there is none', () => {
      currentUserSignal.set(null);
      const selected = makeUser({ id: 's1' });
      service.selectedUsers.set([selected]);

      expect(service.membersToSubmit()).toEqual([{ id: 's1' }]);
    });
  });

  describe('canSubmit', () => {
    it('is true when allMembersSelected is true, regardless of selectedUsers', () => {
      service.allMembersSelected.set(true);
      service.selectedUsers.set([]);
      expect(service.canSubmit()).toBeTrue();
    });

    it('is false when allMembersSelected is false and selectedUsers is empty', () => {
      service.allMembersSelected.set(false);
      service.selectedUsers.set([]);
      expect(service.canSubmit()).toBeFalse();
    });

    it('is true when allMembersSelected is false but selectedUsers is non-empty', () => {
      service.allMembersSelected.set(false);
      service.selectedUsers.set([makeUser()]);
      expect(service.canSubmit()).toBeTrue();
    });

    it('is false while a create/add operation is in flight (isSubmitting)', async () => {
      let resolveAdd!: (value?: any) => void;
      fireServiceSpy.addChannel.and.returnValue(new Promise<any>((resolve) => (resolveAdd = resolve)));
      service.selectedUsers.set([makeUser()]);

      const pending = service.createChannel(makeChannel());
      expect(service.canSubmit()).toBeFalse();

      resolveAdd();
      await pending;
      expect(service.canSubmit()).toBeTrue();
    });
  });

  describe('setActiveChannel()', () => {
    it('clears the current channel and does not subscribe when id is null', () => {
      service.currentChannel.set(makeChannel());
      service.setActiveChannel(null);

      expect(service.currentChannel()).toBeNull();
      expect(fireServiceSpy.subChannelDoc).not.toHaveBeenCalled();
    });

    it('subscribes to the channel doc and updates currentChannel via the callback', () => {
      const channel = makeChannel({ id: 'c1' });
      fireServiceSpy.subChannelDoc.and.callFake((_id: string, callback: (c: Channel | null) => void) => {
        callback(channel);
        return jasmine.createSpy('unsub');
      });

      service.setActiveChannel('c1');

      expect(fireServiceSpy.subChannelDoc).toHaveBeenCalledWith('c1', jasmine.any(Function));
      expect(service.currentChannel()).toEqual(channel);
    });

    it('unsubscribes the previous listener when switching to a new channel', () => {
      const unsub1 = jasmine.createSpy('unsub1');
      const unsub2 = jasmine.createSpy('unsub2');
      fireServiceSpy.subChannelDoc.and.returnValues(unsub1, unsub2);

      service.setActiveChannel('c1');
      expect(unsub1).not.toHaveBeenCalled();

      service.setActiveChannel('c2');
      expect(unsub1).toHaveBeenCalled();
      expect(unsub2).not.toHaveBeenCalled();
    });

    it('unsubscribes the previous listener when clearing with null', () => {
      const unsub1 = jasmine.createSpy('unsub1');
      fireServiceSpy.subChannelDoc.and.returnValue(unsub1);

      service.setActiveChannel('c1');
      service.setActiveChannel(null);

      expect(unsub1).toHaveBeenCalled();
    });
  });

  describe('createChannel()', () => {
    it('sets isSubmitting during the call and clears it afterwards on success', async () => {
      fireServiceSpy.addChannel.and.resolveTo();
      const data = makeChannel();

      await service.createChannel(data);

      expect(fireServiceSpy.addChannel).toHaveBeenCalledWith(data);
      expect(service.canSubmit()).toBeFalse(); // isSubmitting cleared, but selectedUsers still empty
    });

    it('rethrows and still clears isSubmitting on failure', async () => {
      const error = new Error('boom');
      fireServiceSpy.addChannel.and.rejectWith(error);

      await expectAsync(service.createChannel(makeChannel())).toBeRejectedWith(error);

      service.selectedUsers.set([makeUser()]);
      expect(service.canSubmit()).toBeTrue(); // isSubmitting was reset, not stuck "true"
    });
  });

  describe('addUserToSelection()', () => {
    it('adds a new user, resets allMembersSelected and the search query', () => {
      service.allMembersSelected.set(true);
      service.updateSearchQuery('quer');
      const user = makeUser({ id: 'u1' });

      service.addUserToSelection(user);

      expect(service.selectedUsers()).toEqual([user]);
      expect(service.allMembersSelected()).toBeFalse();
      expect(service.userSearchQuery()).toBe('');
    });

    it('does not add a duplicate user (matched by id)', () => {
      const user = makeUser({ id: 'u1' });
      service.addUserToSelection(user);
      service.addUserToSelection({ ...user, displayName: 'Renamed' });

      expect(service.selectedUsers()).toEqual([user]);
    });
  });

  describe('removeUserFromSelection()', () => {
    it('removes the user at the given index', () => {
      const a = makeUser({ id: 'a' });
      const b = makeUser({ id: 'b' });
      service.selectedUsers.set([a, b]);

      service.removeUserFromSelection(0);

      expect(service.selectedUsers()).toEqual([b]);
    });
  });

  describe('resetSelection()', () => {
    it('clears selectedUsers and the search query', () => {
      service.selectedUsers.set([makeUser()]);
      service.updateSearchQuery('abc');

      service.resetSelection();

      expect(service.selectedUsers()).toEqual([]);
      expect(service.userSearchQuery()).toBe('');
    });
  });

  describe('updateSearchQuery()', () => {
    it('sets the userSearchQuery signal', () => {
      service.updateSearchQuery('hello');
      expect(service.userSearchQuery()).toBe('hello');
    });
  });

  describe('updateName() / updateDescription()', () => {
    it('updateName delegates to fireService.updateChannelData with {name}', async () => {
      fireServiceSpy.updateChannelData.and.resolveTo();
      await service.updateName('c1', 'New Name');
      expect(fireServiceSpy.updateChannelData).toHaveBeenCalledWith('c1', { name: 'New Name' });
    });

    it('updateDescription delegates to fireService.updateChannelData with {description}', async () => {
      fireServiceSpy.updateChannelData.and.resolveTo();
      await service.updateDescription('c1', 'New Description');
      expect(fireServiceSpy.updateChannelData).toHaveBeenCalledWith('c1', { description: 'New Description' });
    });
  });

  describe('addMembers()', () => {
    it('does nothing when id is falsy', async () => {
      await service.addMembers('', [{ id: 'u1' }]);
      expect(fireServiceSpy.addChannelMembers).not.toHaveBeenCalled();
    });

    it('does nothing when userObjects is empty', async () => {
      await service.addMembers('c1', []);
      expect(fireServiceSpy.addChannelMembers).not.toHaveBeenCalled();
    });

    it('does nothing when userObjects is null/undefined', async () => {
      await service.addMembers('c1', undefined as any);
      expect(fireServiceSpy.addChannelMembers).not.toHaveBeenCalled();
    });

    it('adds the members and resets the selection on success', async () => {
      fireServiceSpy.addChannelMembers.and.resolveTo();
      service.selectedUsers.set([makeUser()]);

      await service.addMembers('c1', [{ id: 'u1' }]);

      expect(fireServiceSpy.addChannelMembers).toHaveBeenCalledWith('c1', [{ id: 'u1' }]);
      expect(service.selectedUsers()).toEqual([]);
    });

    it('logs, rethrows and still clears isSubmitting on failure', async () => {
      const error = new Error('add failed');
      fireServiceSpy.addChannelMembers.and.rejectWith(error);
      spyOn(console, 'error');

      await expectAsync(service.addMembers('c1', [{ id: 'u1' }])).toBeRejectedWith(error);

      expect(console.error).toHaveBeenCalled();
      service.selectedUsers.set([makeUser()]);
      expect(service.canSubmit()).toBeTrue();
    });
  });

  describe('findChannelByName()', () => {
    it('delegates to fireService.findChannelByName and returns its result', async () => {
      const channel = makeChannel({ name: 'general' });
      fireServiceSpy.findChannelByName.and.resolveTo(channel);

      const result = await service.findChannelByName('general');

      expect(fireServiceSpy.findChannelByName).toHaveBeenCalledWith('general');
      expect(result).toBe(channel);
    });

    it('returns null when not found', async () => {
      fireServiceSpy.findChannelByName.and.resolveTo(null);
      const result = await service.findChannelByName('ghost');
      expect(result).toBeNull();
    });
  });

  describe('leaveChannel()', () => {
    it('calls fireService.leaveChannel when there is a current user and current channel', async () => {
      fireServiceSpy.leaveChannel.and.resolveTo();
      currentUserSignal.set(makeUser({ id: 'me' }));
      service.currentChannel.set(makeChannel({ id: 'c1' }));

      await service.leaveChannel();

      expect(fireServiceSpy.leaveChannel).toHaveBeenCalledWith('c1', 'me');
    });

    it('does nothing when there is no current user', async () => {
      currentUserSignal.set(null);
      service.currentChannel.set(makeChannel({ id: 'c1' }));

      await service.leaveChannel();

      expect(fireServiceSpy.leaveChannel).not.toHaveBeenCalled();
    });

    it('does nothing when there is no current channel', async () => {
      currentUserSignal.set(makeUser({ id: 'me' }));
      service.currentChannel.set(null);

      await service.leaveChannel();

      expect(fireServiceSpy.leaveChannel).not.toHaveBeenCalled();
    });
  });
});
