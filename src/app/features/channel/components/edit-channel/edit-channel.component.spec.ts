import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialogRef } from '@angular/material/dialog';

import { EditChannelComponent } from './edit-channel.component';
import { ChannelService } from '../../services/channel/channel.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { ProfileDialogService } from '../../../../shared/services/profile-dialog/profile-dialog.service';
import { NotificationService } from '../../../../shared/services/notification/notification.service';

import { makeUser } from '../../../../../testing/user-fixtures';
import { makeChannel } from '../../../../../testing/channel-fixtures';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { User } from '../../../auth/models/user/user';

/** Same dedup-aware ChannelService stand-in used by the add-member spec, so the
 * "no duplicate members" wiring is verified through the real update logic. */
function createChannelServiceMock() {
  const selectedUsers = mockSignal<User[]>([]);
  const userSearchQuery = mockSignal('');
  const allMembersSelected = mockSignal(false);
  const currentChannel = mockSignal(makeChannel({ id: 'channel-1', name: 'general', description: 'desc' }));

  return {
    currentChannel,
    selectedUsers,
    userSearchQuery,
    allMembersSelected,
    enrichedMembers: mockSignal<User[]>([]),
    filteredUsers: mockSignal<User[]>([]),
    creatorName: mockSignal('Ersteller Name'),
    canSubmit: mockSignal(true),
    addUserToSelection: jasmine.createSpy('addUserToSelection').and.callFake((user: User) => {
      if (selectedUsers().find((u) => u.id === user.id)) return;
      selectedUsers.set([...selectedUsers(), user]);
    }),
    resetSelection: jasmine.createSpy('resetSelection').and.callFake(() => {
      selectedUsers.set([]);
      userSearchQuery.set('');
    }),
    updateSearchQuery: jasmine.createSpy('updateSearchQuery').and.callFake((q: string) => userSearchQuery.set(q)),
    addMembers: jasmine.createSpy('addMembers').and.resolveTo(undefined),
    updateName: jasmine.createSpy('updateName').and.resolveTo(undefined),
    updateDescription: jasmine.createSpy('updateDescription').and.resolveTo(undefined),
    leaveChannel: jasmine.createSpy('leaveChannel').and.resolveTo(undefined),
  };
}

describe('EditChannelComponent', () => {
  let fixture: ComponentFixture<EditChannelComponent>;
  let component: EditChannelComponent;
  let channelServiceSpy: ReturnType<typeof createChannelServiceMock>;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
  let profileDialogServiceSpy: jasmine.SpyObj<ProfileDialogService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<EditChannelComponent>>;

  beforeEach(async () => {
    channelServiceSpy = createChannelServiceMock();
    navigationServiceSpy = jasmine.createSpyObj<NavigationService>('NavigationService', ['goToNewMessage']);
    profileDialogServiceSpy = jasmine.createSpyObj<ProfileDialogService>('ProfileDialogService', ['open']);
    notificationServiceSpy = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<EditChannelComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [EditChannelComponent],
      providers: [
        { provide: ChannelService, useValue: channelServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: ProfileDialogService, useValue: profileDialogServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(EditChannelComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('resets "all members" and clears any leftover selection on construction', () => {
    expect(channelServiceSpy.allMembersSelected()).toBe(false);
    expect(channelServiceSpy.resetSelection).toHaveBeenCalled();
  });

  describe('addUserToSelection (duplicate-member guard)', () => {
    it('delegates to channelService.addUserToSelection', () => {
      fixture.detectChanges();
      const user = makeUser();
      component.addUserToSelection(user);
      expect(channelServiceSpy.addUserToSelection).toHaveBeenCalledWith(user);
      expect(channelServiceSpy.selectedUsers()).toEqual([user]);
    });

    it('does not add a duplicate when the same user is selected twice', () => {
      fixture.detectChanges();
      const user = makeUser();
      component.addUserToSelection(user);
      component.addUserToSelection(user);
      expect(channelServiceSpy.selectedUsers().length).toBe(1);
    });

    it('hides the user bar after picking a user', () => {
      fixture.detectChanges();
      component.showUserBar = true;
      component.addUserToSelection(makeUser());
      expect(component.showUserBar).toBe(false);
    });
  });

  describe('onSearchInput', () => {
    it('forwards the value to channelService.updateSearchQuery and opens the user bar', () => {
      fixture.detectChanges();
      const event = { target: { value: 'anna' } } as unknown as Event;
      component.onSearchInput(event);
      expect(channelServiceSpy.updateSearchQuery).toHaveBeenCalledWith('anna');
      expect(component.showUserBar).toBe(true);
    });
  });

  describe('onSubmit (add members)', () => {
    it('does nothing when there is no current channel', async () => {
      channelServiceSpy.currentChannel.set(null as any);
      fixture.detectChanges();
      await component.onSubmit();
      expect(channelServiceSpy.addMembers).not.toHaveBeenCalled();
    });

    it('does nothing when there are no selected users', async () => {
      fixture.detectChanges();
      channelServiceSpy.selectedUsers.set([]);
      await component.onSubmit();
      expect(channelServiceSpy.addMembers).not.toHaveBeenCalled();
    });

    it('adds selected members, clears selection, closes the add-member panel and notifies success', async () => {
      fixture.detectChanges();
      const user = makeUser({ id: 'user-9' });
      channelServiceSpy.selectedUsers.set([user]);
      component.isAddMemberOpen.set(true);

      await component.onSubmit();

      expect(channelServiceSpy.addMembers).toHaveBeenCalledWith('channel-1', [{ id: 'user-9' }]);
      expect(channelServiceSpy.selectedUsers()).toEqual([]);
      expect(component.isAddMemberOpen()).toBe(false);
      expect(notificationServiceSpy.success).toHaveBeenCalledWith('User hinzugefügt');
    });

    it('notifies an error when addMembers rejects', async () => {
      channelServiceSpy.addMembers.and.rejectWith(new Error('fail'));
      fixture.detectChanges();
      channelServiceSpy.selectedUsers.set([makeUser()]);

      await component.onSubmit();

      expect(notificationServiceSpy.error).toHaveBeenCalledWith('Fehler beim Hinzufügen');
    });
  });

  describe('onEditChannelName', () => {
    it('enters edit mode and seeds tempName from the current channel on first call', async () => {
      fixture.detectChanges();
      await component.onEditChannelName();
      expect(component.channelNameEdit()).toBe(true);
      expect(component.tempName()).toBe('general');
    });

    it('saves the trimmed name and notifies success when it changed', async () => {
      fixture.detectChanges();
      await component.onEditChannelName();
      component.tempName.set('  newname  ');

      await component.onEditChannelName();

      expect(channelServiceSpy.updateName).toHaveBeenCalledWith('channel-1', 'newname');
      expect(notificationServiceSpy.success).toHaveBeenCalledWith('Name aktualisiert');
      expect(component.channelNameEdit()).toBe(false);
    });

    it('does not call updateName when the trimmed name is unchanged', async () => {
      fixture.detectChanges();
      await component.onEditChannelName();
      component.tempName.set('general');

      await component.onEditChannelName();

      expect(channelServiceSpy.updateName).not.toHaveBeenCalled();
      expect(component.channelNameEdit()).toBe(false);
    });

    it('does not call updateName when the trimmed name is empty', async () => {
      fixture.detectChanges();
      await component.onEditChannelName();
      component.tempName.set('   ');

      await component.onEditChannelName();

      expect(channelServiceSpy.updateName).not.toHaveBeenCalled();
    });

    it('notifies an error when updateName rejects', async () => {
      channelServiceSpy.updateName.and.rejectWith(new Error('fail'));
      fixture.detectChanges();
      await component.onEditChannelName();
      component.tempName.set('newname');

      await component.onEditChannelName();

      expect(notificationServiceSpy.error).toHaveBeenCalledWith('Fehler beim Speichern');
    });

    it('does nothing when there is no current channel', async () => {
      channelServiceSpy.currentChannel.set(null as any);
      fixture.detectChanges();
      await component.onEditChannelName();
      expect(component.channelNameEdit()).toBe(false);
    });
  });

  describe('onEditChannelDescription', () => {
    it('enters edit mode and seeds tempDescription on first call', async () => {
      fixture.detectChanges();
      await component.onEditChannelDescription();
      expect(component.channelDescriptionEdit()).toBe(true);
      expect(component.tempDescription()).toBe('desc');
    });

    it('saves the new description and notifies success when it changed', async () => {
      fixture.detectChanges();
      await component.onEditChannelDescription();
      component.tempDescription.set('new desc');

      await component.onEditChannelDescription();

      expect(channelServiceSpy.updateDescription).toHaveBeenCalledWith('channel-1', 'new desc');
      expect(notificationServiceSpy.success).toHaveBeenCalledWith('Beschreibung aktualisiert');
      expect(component.channelDescriptionEdit()).toBe(false);
    });

    it('does not call updateDescription when unchanged', async () => {
      fixture.detectChanges();
      await component.onEditChannelDescription();
      component.tempDescription.set('desc');

      await component.onEditChannelDescription();

      expect(channelServiceSpy.updateDescription).not.toHaveBeenCalled();
    });

    it('swallows errors from updateDescription silently', async () => {
      channelServiceSpy.updateDescription.and.rejectWith(new Error('fail'));
      fixture.detectChanges();
      await component.onEditChannelDescription();
      component.tempDescription.set('new desc');

      await expectAsync(component.onEditChannelDescription()).toBeResolved();
      expect(component.channelDescriptionEdit()).toBe(false);
    });
  });

  describe('leaveChannel', () => {
    it('leaves the channel, closes the dialog, notifies success and navigates to new-message', async () => {
      fixture.detectChanges();
      await component.leaveChannel();

      expect(channelServiceSpy.leaveChannel).toHaveBeenCalled();
      expect(dialogRefSpy.close).toHaveBeenCalled();
      expect(notificationServiceSpy.success).toHaveBeenCalledWith('Channel verlassen');
      expect(navigationServiceSpy.goToNewMessage).toHaveBeenCalled();
    });

    it('notifies an error and does not navigate when leaveChannel rejects', async () => {
      channelServiceSpy.leaveChannel.and.rejectWith(new Error('fail'));
      fixture.detectChanges();

      await component.leaveChannel();

      expect(notificationServiceSpy.error).toHaveBeenCalledWith('Fehler beim Verlassen des Channels');
      expect(navigationServiceSpy.goToNewMessage).not.toHaveBeenCalled();
    });
  });

  describe('removeSelectedUser', () => {
    it('removes the user at the given index', () => {
      fixture.detectChanges();
      const [u1, u2] = [makeUser(), makeUser()];
      channelServiceSpy.selectedUsers.set([u1, u2]);

      component.removeSelectedUser(0);

      expect(channelServiceSpy.selectedUsers()).toEqual([u2]);
    });
  });

  describe('toogleAddMemberState / user bar / dialog', () => {
    it('toggles isAddMemberOpen', () => {
      fixture.detectChanges();
      expect(component.isAddMemberOpen()).toBe(false);
      component.toogleAddMemberState();
      expect(component.isAddMemberOpen()).toBe(true);
      component.toogleAddMemberState();
      expect(component.isAddMemberOpen()).toBe(false);
    });

    it('openUserBar shows the bar; closeUserBar hides it and clears the query', () => {
      fixture.detectChanges();
      component.openUserBar();
      expect(component.showUserBar).toBe(true);

      channelServiceSpy.userSearchQuery.set('abc');
      component.closeUserBar();
      expect(component.showUserBar).toBe(false);
      expect(channelServiceSpy.userSearchQuery()).toBe('');
    });

    it('openProfileDialog opens the profile dialog and closes this dialog', () => {
      fixture.detectChanges();
      const user = makeUser();
      component.openProfileDialog(user);
      expect(profileDialogServiceSpy.open).toHaveBeenCalledWith(user);
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });

    it('closeDialog closes the MatDialogRef', () => {
      fixture.detectChanges();
      component.closeDialog();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('template', () => {
    it('closes the user bar when clicking the main content area', () => {
      fixture.detectChanges();
      component.openUserBar();
      fixture.detectChanges();
      expect(component.showUserBar).toBe(true);

      (fixture.nativeElement.querySelector('main.main') as HTMLElement).click();
      fixture.detectChanges();

      expect(component.showUserBar).toBe(false);
    });

    it('renders the channel name and description read-only by default', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.channel-name-display').textContent).toContain('general');
      expect(fixture.nativeElement.querySelector('.content--description').textContent).toContain('desc');
    });
  });
});
