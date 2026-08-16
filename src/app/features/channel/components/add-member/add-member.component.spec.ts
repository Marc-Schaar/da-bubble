import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { AddMemberComponent } from './add-member.component';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { ChannelService } from '../../services/channel/channel.service';
import { ProfileDialogService } from '../../../../shared/services/profile-dialog/profile-dialog.service';

import { makeUser } from '../../../../../testing/user-fixtures';
import { makeChannel } from '../../../../../testing/channel-fixtures';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { User } from '../../../auth/models/user/user';

/**
 * Builds a ChannelService stand-in whose addUserToSelection/resetSelection
 * implement the same dedup/reset behavior as the real service, so tests can
 * verify the component's wiring produces correct end-to-end results (not
 * just that a spy was called).
 */
function createChannelServiceMock() {
  const selectedUsers = mockSignal<User[]>([]);
  const userSearchQuery = mockSignal('');
  const allMembersSelected = mockSignal(false);
  const currentChannel = mockSignal(makeChannel({ id: 'channel-1' }));

  const service = {
    currentChannel,
    selectedUsers,
    userSearchQuery,
    allMembersSelected,
    enrichedMembers: mockSignal<User[]>([]),
    filteredUsers: mockSignal<User[]>([]),
    canSubmit: mockSignal(true),
    membersToSubmit: mockSignal<{ id: string }[]>([{ id: 'user-2' }]),
    addUserToSelection: jasmine.createSpy('addUserToSelection').and.callFake((user: User) => {
      if (selectedUsers().find((u) => u.id === user.id)) return;
      selectedUsers.set([...selectedUsers(), user]);
    }),
    removeUserFromSelection: jasmine.createSpy('removeUserFromSelection').and.callFake((index: number) => {
      const updated = [...selectedUsers()];
      updated.splice(index, 1);
      selectedUsers.set(updated);
    }),
    resetSelection: jasmine.createSpy('resetSelection').and.callFake(() => {
      selectedUsers.set([]);
      userSearchQuery.set('');
    }),
    updateSearchQuery: jasmine.createSpy('updateSearchQuery').and.callFake((q: string) => userSearchQuery.set(q)),
    addMembers: jasmine.createSpy('addMembers').and.resolveTo(undefined),
  };

  return service;
}

describe('AddMemberComponent', () => {
  let fixture: ComponentFixture<AddMemberComponent>;
  let component: AddMemberComponent;
  let channelServiceSpy: ReturnType<typeof createChannelServiceMock>;
  let authServiceSpy: any;
  let profileDialogServiceSpy: jasmine.SpyObj<ProfileDialogService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddMemberComponent>>;

  const currentUser = makeUser({ id: 'user-1' });

  beforeEach(async () => {
    channelServiceSpy = createChannelServiceMock();
    authServiceSpy = { currentUser: mockSignal(currentUser) };
    profileDialogServiceSpy = jasmine.createSpyObj<ProfileDialogService>('ProfileDialogService', ['open']);
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<AddMemberComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AddMemberComponent],
      providers: [
        { provide: ChannelService, useValue: channelServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: ProfileDialogService, useValue: profileDialogServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddMemberComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('resets the "all members" flag and clears any leftover selection on construction', () => {
    expect(channelServiceSpy.allMembersSelected()).toBe(false);
    expect(channelServiceSpy.resetSelection).toHaveBeenCalled();
  });

  describe('addUserToSelection (duplicate-user regression)', () => {
    it('delegates to channelService.addUserToSelection and hides the user bar', () => {
      fixture.detectChanges();
      component.showUserBar = true;
      const user = makeUser();

      component.addUserToSelection(user);

      expect(channelServiceSpy.addUserToSelection).toHaveBeenCalledWith(user);
      expect(component.showUserBar).toBe(false);
      expect(channelServiceSpy.selectedUsers()).toEqual([user]);
    });

    it('does not add a duplicate when the same user is selected twice', () => {
      fixture.detectChanges();
      const user = makeUser();

      component.addUserToSelection(user);
      component.addUserToSelection(user);

      expect(channelServiceSpy.addUserToSelection).toHaveBeenCalledTimes(2);
      expect(channelServiceSpy.selectedUsers().length).toBe(1);
      expect(channelServiceSpy.selectedUsers()).toEqual([user]);
    });

    it('renders only one selected-user chip after clicking the same bar entry twice', () => {
      component.openAddMember();
      const user = makeUser();
      channelServiceSpy.filteredUsers.set([user]);
      fixture.detectChanges();

      const clickBarBtn = () => (fixture.nativeElement.querySelector('.choose-user-bar .user__list__btn') as HTMLButtonElement)?.click();
      clickBarBtn();
      fixture.detectChanges();
      clickBarBtn();
      fixture.detectChanges();

      const selectedItems = fixture.nativeElement.querySelectorAll('.mini-profile');
      expect(selectedItems.length).toBe(1);
    });
  });

  describe('onSearchInput', () => {
    it('forwards the input value to channelService.updateSearchQuery and opens the user bar', () => {
      fixture.detectChanges();
      component.showUserBar = false;
      const event = { target: { value: 'ma' } } as unknown as Event;

      component.onSearchInput(event);

      expect(channelServiceSpy.updateSearchQuery).toHaveBeenCalledWith('ma');
      expect(channelServiceSpy.userSearchQuery()).toBe('ma');
      expect(component.showUserBar).toBe(true);
    });
  });

  describe('onSubmit', () => {
    it('does nothing when there is no current channel id', async () => {
      channelServiceSpy.currentChannel.set(null as any);
      fixture.detectChanges();

      await component.onSubmit();

      expect(channelServiceSpy.addMembers).not.toHaveBeenCalled();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
    });

    it('does nothing when there are no members to submit', async () => {
      channelServiceSpy.membersToSubmit.set([]);
      fixture.detectChanges();

      await component.onSubmit();

      expect(channelServiceSpy.addMembers).not.toHaveBeenCalled();
    });

    it('adds the members, resets selection and closes the dialog on success', async () => {
      fixture.detectChanges();

      await component.onSubmit();

      expect(channelServiceSpy.addMembers).toHaveBeenCalledWith('channel-1', [{ id: 'user-2' }]);
      expect(channelServiceSpy.resetSelection).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalled();
      expect(component.isSubmiting()).toBe(false);
    });

    it('logs the error and resets isSubmiting without closing when addMembers rejects', async () => {
      channelServiceSpy.addMembers.and.rejectWith(new Error('fail'));
      spyOn(console, 'log');
      fixture.detectChanges();

      await component.onSubmit();

      expect(console.log).toHaveBeenCalled();
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(component.isSubmiting()).toBe(false);
    });
  });

  describe('window / dialog toggles', () => {
    it('changeWindow() opens the add-member window', () => {
      fixture.detectChanges();
      expect(component.addMemberWindow).toBe(false);
      component.changeWindow();
      expect(component.addMemberWindow).toBe(true);
    });

    it('openAddMember() also opens the add-member window', () => {
      fixture.detectChanges();
      component.openAddMember();
      expect(component.addMemberWindow).toBe(true);
    });

    it('openUserBar() shows the user bar', () => {
      fixture.detectChanges();
      component.openUserBar();
      expect(component.showUserBar).toBe(true);
    });

    it('closeDialog() closes the MatDialogRef', () => {
      fixture.detectChanges();
      component.closeDialog();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('openProfileDialog', () => {
    it('delegates to ProfileDialogService.open', () => {
      fixture.detectChanges();
      const user = makeUser();
      component.openProfileDialog(user);
      expect(profileDialogServiceSpy.open).toHaveBeenCalledWith(user);
    });
  });

  describe('template rendering', () => {
    it('shows the member list header when addMemberWindow is false', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Mitglieder');
      expect(fixture.nativeElement.querySelector('.user__list')).toBeTruthy();
    });

    it('shows the add-people form once addMemberWindow is true', () => {
      fixture.detectChanges();
      // Click the real button (rather than calling changeWindow() directly) so
      // this OnPush component's view is actually marked dirty and re-rendered.
      const openBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.add-member-btn button');
      openBtn.click();
      fixture.detectChanges();
      expect(fixture.nativeElement.textContent).toContain('Leute hinzufügen');
      expect(fixture.nativeElement.querySelector('#user-search-bar')).toBeTruthy();
    });
  });
});
