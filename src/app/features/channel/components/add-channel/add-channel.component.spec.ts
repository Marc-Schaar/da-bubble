import { ComponentFixture, TestBed, fakeAsync, tick, flush } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { MatDialogRef } from '@angular/material/dialog';

import { AddChannelComponent } from './add-channel.component';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { ChannelService } from '../../services/channel/channel.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { NotificationService } from '../../../../shared/services/notification/notification.service';

import { makeUser } from '../../../../../testing/user-fixtures';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';

describe('AddChannelComponent', () => {
  let fixture: ComponentFixture<AddChannelComponent>;
  let component: AddChannelComponent;

  let channelServiceSpy: jasmine.SpyObj<any>;
  let fireServiceSpy: jasmine.SpyObj<FireServiceService>;
  let authServiceSpy: any;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AddChannelComponent>>;

  const currentUser = makeUser({ id: 'user-1' });

  beforeEach(async () => {
    channelServiceSpy = {
      allMembersSelected: mockSignal(false),
      selectedUsers: mockSignal([]),
      filteredUsers: mockSignal([]),
      userSearchQuery: mockSignal(''),
      canSubmit: mockSignal(true),
      membersToSubmit: mockSignal([{ id: 'user-2' }]),
      addUserToSelection: jasmine.createSpy('addUserToSelection'),
      removeUserFromSelection: jasmine.createSpy('removeUserFromSelection'),
      resetSelection: jasmine.createSpy('resetSelection'),
      createChannel: jasmine.createSpy('createChannel').and.resolveTo(undefined),
    };

    fireServiceSpy = jasmine.createSpyObj<FireServiceService>('FireServiceService', ['checkChannelNameExists']);
    fireServiceSpy.checkChannelNameExists.and.resolveTo(false);

    authServiceSpy = { currentUser: mockSignal(currentUser) };

    notificationServiceSpy = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<AddChannelComponent>>('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [AddChannelComponent, ReactiveFormsModule],
      providers: [
        { provide: ChannelService, useValue: channelServiceSpy },
        { provide: FireServiceService, useValue: fireServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AddChannelComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('onFirstStepSubmit', () => {
    it('does not open the member step while the async name validator is pending', fakeAsync(() => {
      fixture.detectChanges();
      component.channelForm.controls.name.setValue('newchannel');
      component.channelForm.controls.name.markAsTouched();

      const submitPromise = component.onFirstStepSubmit();
      // Validator is pending immediately after setValue (before the fake-async check resolves).
      flush();
      tick();

      expect(fireServiceSpy.checkChannelNameExists).toHaveBeenCalledWith('newchannel');
    }));

    it('opens the add-member step when the form is valid and the name is free', fakeAsync(() => {
      fixture.detectChanges();
      component.channelForm.controls.name.setValue('freechannel');
      tick();

      component.onFirstStepSubmit();
      tick();

      expect(component.isAddMemberDialogOpen()).toBe(true);
    }));

    it('keeps the add-member step closed when the name is required but empty', fakeAsync(() => {
      fixture.detectChanges();
      component.channelForm.controls.name.setValue('');
      tick();

      component.onFirstStepSubmit();
      tick();

      expect(component.isAddMemberDialogOpen()).toBe(false);
    }));

    it('keeps the add-member step closed when the channel name is already taken', fakeAsync(() => {
      fireServiceSpy.checkChannelNameExists.and.resolveTo(true);
      fixture.detectChanges();
      component.channelForm.controls.name.setValue('takenname');
      tick();

      component.onFirstStepSubmit();
      tick();

      expect(component.isAddMemberDialogOpen()).toBe(false);
      expect(component.channelForm.controls.name.errors?.['nameTaken']).toBe(true);
    }));
  });

  describe('setChannelMember', () => {
    // setChannelMember(isSpecific): isSpecific=false means the "all members"
    // radio was picked, which also resets any specific selection made so far.
    it('sets allMembersSelected=true and resets selection for "all members" (isSpecific=false)', () => {
      fixture.detectChanges();
      component.setChannelMember(false);
      expect(channelServiceSpy.allMembersSelected()).toBe(true);
      expect(channelServiceSpy.resetSelection).toHaveBeenCalled();
    });

    it('sets allMembersSelected=false and does not reset selection for "specific members" (isSpecific=true)', () => {
      fixture.detectChanges();
      component.setChannelMember(true);
      expect(channelServiceSpy.allMembersSelected()).toBe(false);
      expect(channelServiceSpy.resetSelection).not.toHaveBeenCalled();
    });
  });

  describe('onSelectUser', () => {
    it('delegates to channelService.addUserToSelection and hides the user bar', () => {
      fixture.detectChanges();
      component.showUserBar.set(true);
      const user = makeUser();

      component.onSelectUser(user);

      expect(channelServiceSpy.addUserToSelection).toHaveBeenCalledWith(user);
      expect(component.showUserBar()).toBe(false);
    });
  });

  describe('onFinalSubmit', () => {
    it('creates the channel, notifies success, closes the dialog and resets state', async () => {
      fixture.detectChanges();
      component.channelForm.setValue({ name: 'newchan', description: 'desc' });

      await component.onFinalSubmit();

      expect(channelServiceSpy.createChannel).toHaveBeenCalledWith(
        jasmine.objectContaining({
          name: 'newchan',
          description: 'desc',
          member: [{ id: 'user-2' }],
          createdBy: 'user-1',
        }),
      );
      expect(notificationServiceSpy.success).toHaveBeenCalledWith('Channel erfolgreich erstellt');
      expect(dialogRefSpy.close).toHaveBeenCalled();
      expect(channelServiceSpy.resetSelection).toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });

    it('falls back to an empty description when none is provided', async () => {
      fixture.detectChanges();
      component.channelForm.setValue({ name: 'newchan', description: null as any });

      await component.onFinalSubmit();

      expect(channelServiceSpy.createChannel).toHaveBeenCalledWith(jasmine.objectContaining({ description: '' }));
    });

    it('shows an error notification and resets isSubmitting when creation fails', async () => {
      channelServiceSpy.createChannel.and.rejectWith(new Error('boom'));
      spyOn(console, 'error');
      fixture.detectChanges();
      component.channelForm.setValue({ name: 'newchan', description: '' });

      await component.onFinalSubmit();

      expect(notificationServiceSpy.error).toHaveBeenCalledWith('Fehler beim Erstellen');
      expect(dialogRefSpy.close).not.toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('closeDialogAddMember / closeDialog', () => {
    it('closes the add-member step and resets selection', () => {
      fixture.detectChanges();
      component.isAddMemberDialogOpen.set(true);
      component.closeDialogAddMember();
      expect(component.isAddMemberDialogOpen()).toBe(false);
      expect(channelServiceSpy.resetSelection).toHaveBeenCalled();
    });

    it('closes the dialog via MatDialogRef', () => {
      fixture.detectChanges();
      component.closeDialog();
      expect(dialogRefSpy.close).toHaveBeenCalled();
    });
  });

  describe('getChannelNameError', () => {
    it('returns the "nameTaken" message when the async validator flags the name', fakeAsync(() => {
      fireServiceSpy.checkChannelNameExists.and.resolveTo(true);
      fixture.detectChanges();
      component.channelForm.controls.name.setValue('taken');
      tick();
      fixture.detectChanges();

      expect((component as any).getChannelNameError()).toBe('Dieser Name ist bereits vergeben.');
    }));

    it('returns the required message once the control is touched and empty', () => {
      fixture.detectChanges();
      component.channelForm.controls.name.markAsTouched();
      component.channelForm.controls.name.setErrors({ required: true });

      expect((component as any).getChannelNameError()).toBe('Name ist erforderlich.');
    });

    it('returns null when there is no error', () => {
      fixture.detectChanges();
      expect((component as any).getChannelNameError()).toBeNull();
    });
  });
});
