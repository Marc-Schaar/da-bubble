import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';

import { UserProfileComponent } from './user-profile.component';
import { AuthService } from '../../../features/auth/services/auth/auth.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { NotificationService } from '../../services/notification/notification.service';
import { AvatarSelectionComponent } from '../avatar-selection-dialog/avatar-selection.component';
import { makeUser } from '../../../../testing/user-fixtures';
import { mockSignal } from '../../../../testing/signal-service-mock.util';

describe('UserProfileComponent', () => {
  let fixture: ComponentFixture<UserProfileComponent>;
  let component: UserProfileComponent;

  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<UserProfileComponent>>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;
  let dialogAfterClosed$: Subject<unknown>;
  let currentUserSignal: ReturnType<typeof mockSignal<ReturnType<typeof makeUser> | null>>;
  let isGuestSignal: ReturnType<typeof mockSignal<boolean>>;
  let isMobileSignal: ReturnType<typeof mockSignal<boolean>>;

  function configure(dialogData: unknown) {
    dialogAfterClosed$ = new Subject();
    currentUserSignal = mockSignal(makeUser({ displayName: 'Erika Musterfrau', email: 'erika@test.local', photoUrl: 'img/avatars/avatar_2.png' }));
    isGuestSignal = mockSignal(false);
    isMobileSignal = mockSignal(false);

    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['updateUserProfile']);
    (authServiceSpy as any).currentUser = currentUserSignal;
    (authServiceSpy as any).isGuest = isGuestSignal;
    authServiceSpy.updateUserProfile.and.resolveTo();

    navigationServiceSpy = jasmine.createSpyObj<NavigationService>('NavigationService', ['selectDirectMessageRecipient']);
    (navigationServiceSpy as any).isMobile = isMobileSignal;

    notificationServiceSpy = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']);

    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<UserProfileComponent>>('MatDialogRef', ['close', 'afterClosed']);
    dialogRefSpy.afterClosed.and.returnValue(dialogAfterClosed$.asObservable());

    matDialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    TestBed.configureTestingModule({
      imports: [UserProfileComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: MAT_DIALOG_DATA, useValue: dialogData },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserProfileComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('own profile (no MAT_DIALOG_DATA)', () => {
    beforeEach(() => configure(null));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('renders the current user displayName and email', () => {
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Erika Musterfrau');
      const emailLink = fixture.nativeElement.querySelector('.email-route');
      expect(emailLink.textContent).toContain('erika@test.local');
    });

    it('shows the "Aktiv" status for the own profile', () => {
      expect((fixture.nativeElement.textContent as string)).toContain('Aktiv');
    });

    it('renders an editable picture container and a "Bearbeiten" edit button, no "Nachricht" button', () => {
      expect(fixture.nativeElement.querySelector('.picture-cont.editable')).toBeTruthy();
      expect((fixture.nativeElement.textContent as string)).toContain('Bearbeiten');
      expect((fixture.nativeElement.textContent as string)).not.toContain('Nachricht');
    });

    it('clicking "Bearbeiten" calls modify(), entering edit mode with the current name/photo staged', () => {
      const editBtn = Array.from(fixture.nativeElement.querySelectorAll('app-button')).find((el: any) =>
        el.textContent?.includes('Bearbeiten'),
      ) as HTMLElement;
      editBtn.querySelector('button')!.click();
      fixture.detectChanges();

      expect(component.modifyInfos()).toBeTrue();
      expect(component.newName()).toBe('Erika Musterfrau');
    });

    it('modify() does nothing when the user is a guest', () => {
      isGuestSignal.set(true);
      component.modify();
      expect(component.modifyInfos()).toBeFalse();
    });

    it('after entering edit mode, renders the name input and Abbrechen/Speichern buttons', () => {
      component.modify();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-input')).toBeTruthy();
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Abbrechen');
      expect(text).toContain('Speichern');
    });

    it('cancel() leaves edit mode and clears the pending photo', () => {
      component.modify();
      (component as any).pendingPhotoUrl.set('staged.png');
      component.cancel();

      expect(component.modifyInfos()).toBeFalse();
      expect((component as any).pendingPhotoUrl()).toBeNull();
    });

    it('saveChanges() does nothing when newName is empty', async () => {
      component.modify();
      component.newName.set('');

      await component.saveChanges();

      expect(authServiceSpy.updateUserProfile).not.toHaveBeenCalled();
    });

    it('saveChanges() calls AuthService.updateUserProfile, shows a success toast, and exits edit mode', fakeAsync(() => {
      component.modify();
      component.newName.set('Neuer Name');
      (component as any).pendingPhotoUrl.set('new-photo.png');

      component.saveChanges();
      expect((component as any).isSaving()).toBeTrue();
      tick();

      expect(authServiceSpy.updateUserProfile).toHaveBeenCalledOnceWith('Neuer Name', 'new-photo.png');
      expect(notificationServiceSpy.success).toHaveBeenCalledOnceWith('Profil aktualisiert');
      expect(component.modifyInfos()).toBeFalse();
      expect((component as any).isSaving()).toBeFalse();
    }));

    it('saveChanges() falls back to the current photoUrl when no new avatar was staged', fakeAsync(() => {
      component.modify();
      component.newName.set('Neuer Name');

      component.saveChanges();
      tick();

      expect(authServiceSpy.updateUserProfile).toHaveBeenCalledOnceWith('Neuer Name', 'img/avatars/avatar_2.png');
    }));

    it('closeMenu() closes the dialog', () => {
      component.closeMenu();
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });

    it('openAvatarSelection() opens AvatarSelectionComponent with the expected config and stages the returned avatar', () => {
      const avatarDialogAfterClosed$ = new Subject<string | undefined>();
      const avatarDialogRefSpy = jasmine.createSpyObj<MatDialogRef<AvatarSelectionComponent>>('MatDialogRef<Avatar>', ['close', 'afterClosed']);
      avatarDialogRefSpy.afterClosed.and.returnValue(avatarDialogAfterClosed$.asObservable());
      matDialogSpy.open.and.returnValue(avatarDialogRefSpy);

      component.openAvatarSelection();

      expect(matDialogSpy.open).toHaveBeenCalledOnceWith(AvatarSelectionComponent, {
        data: { user: currentUserSignal() },
        hasBackdrop: false,
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        ariaLabel: 'Avatar auswählen',
      });

      avatarDialogAfterClosed$.next('img/avatars/avatar_5.png');
      expect((component as any).pendingPhotoUrl()).toBe('img/avatars/avatar_5.png');
    });

    it('openAvatarSelection() leaves pendingPhotoUrl untouched when the dialog closes without a result', () => {
      const avatarDialogAfterClosed$ = new Subject<string | undefined>();
      const avatarDialogRefSpy = jasmine.createSpyObj<MatDialogRef<AvatarSelectionComponent>>('MatDialogRef<Avatar>', ['close', 'afterClosed']);
      avatarDialogRefSpy.afterClosed.and.returnValue(avatarDialogAfterClosed$.asObservable());
      matDialogSpy.open.and.returnValue(avatarDialogRefSpy);

      component.openAvatarSelection();
      avatarDialogAfterClosed$.next(undefined);

      expect((component as any).pendingPhotoUrl()).toBeNull();
    });

    it('when this dialog closes, it also closes a still-open avatar-selection dialog', () => {
      const avatarDialogAfterClosed$ = new Subject<string | undefined>();
      const avatarDialogRefSpy = jasmine.createSpyObj<MatDialogRef<AvatarSelectionComponent>>('MatDialogRef<Avatar>', ['close', 'afterClosed']);
      avatarDialogRefSpy.afterClosed.and.returnValue(avatarDialogAfterClosed$.asObservable());
      matDialogSpy.open.and.returnValue(avatarDialogRefSpy);

      component.openAvatarSelection();
      dialogAfterClosed$.next(undefined);

      expect(avatarDialogRefSpy.close).toHaveBeenCalledTimes(1);
    });

    it('handleClick() stops propagation for clicks that are not on the menu trigger', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');
      Object.defineProperty(event, 'target', { value: document.createElement('div') });

      component.handleClick(event);

      expect(event.stopPropagation).toHaveBeenCalledTimes(1);
    });

    it('handleClick() does not stop propagation when the target is the menu trigger', () => {
      const event = new MouseEvent('click');
      spyOn(event, 'stopPropagation');
      const target = document.createElement('div');
      target.classList.add('menu-trigger');
      Object.defineProperty(event, 'target', { value: target });

      component.handleClick(event);

      expect(event.stopPropagation).not.toHaveBeenCalled();
    });
  });

  describe('receiver profile (MAT_DIALOG_DATA set)', () => {
    const receiver = makeUser({ displayName: 'Max Mustermann', email: 'max@test.local', online: false });

    beforeEach(() => configure(receiver));

    it('renders the receiver profile read-only, without an edit control', () => {
      const text = fixture.nativeElement.textContent as string;
      expect(text).toContain('Max Mustermann');
      expect(text).not.toContain('Bearbeiten');
      expect(fixture.nativeElement.querySelector('.picture-cont.editable')).toBeFalsy();
    });

    it('shows the offline status when the receiver is offline', () => {
      expect((fixture.nativeElement.textContent as string)).toContain('Abwesend');
    });

    it('renders a "Nachricht" button', () => {
      expect((fixture.nativeElement.textContent as string)).toContain('Nachricht');
    });

    it('clicking "Nachricht" opens a direct chat with the receiver and closes the dialog', () => {
      const msgBtn = Array.from(fixture.nativeElement.querySelectorAll('app-button')).find((el: any) =>
        el.textContent?.includes('Nachricht'),
      ) as HTMLElement;
      msgBtn.querySelector('button')!.click();

      expect(navigationServiceSpy.selectDirectMessageRecipient).toHaveBeenCalledOnceWith(receiver.id);
      expect(dialogRefSpy.close).toHaveBeenCalledTimes(1);
    });

    it('openChat() does nothing without receiver data (defensive branch; unreachable via the receiver-profile template)', () => {
      (component as any).receiverData = null;
      component.openChat();
      expect(navigationServiceSpy.selectDirectMessageRecipient).not.toHaveBeenCalled();
    });
  });
});
