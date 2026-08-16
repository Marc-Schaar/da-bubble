import { TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { ProfileDialogService } from './profile-dialog.service';
import { UserProfileComponent } from '../../components/user-profile/user-profile.component';
import { makeUser } from '../../../../testing/user-fixtures';

describe('ProfileDialogService', () => {
  let service: ProfileDialogService;
  let dialogSpy: jasmine.SpyObj<MatDialog>;

  beforeEach(() => {
    dialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);

    TestBed.configureTestingModule({
      providers: [{ provide: MatDialog, useValue: dialogSpy }],
    });
    service = TestBed.inject(ProfileDialogService);
  });

  it('does nothing for null', () => {
    service.open(null);
    expect(dialogSpy.open).not.toHaveBeenCalled();
  });

  it('does nothing for undefined', () => {
    service.open(undefined);
    expect(dialogSpy.open).not.toHaveBeenCalled();
  });

  it('opens UserProfileComponent with the user as read-only dialog data and the expected config', () => {
    const user = makeUser({ displayName: 'Alice Wonderland' });

    service.open(user);

    expect(dialogSpy.open).toHaveBeenCalledWith(UserProfileComponent, {
      data: user,
      panelClass: ['center-dialog'],
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabel: 'Profil von Alice Wonderland',
    });
  });

  it('builds the ariaLabel from the given user\'s displayName', () => {
    const user = makeUser({ displayName: 'Bob' });

    service.open(user);

    const config = dialogSpy.open.calls.mostRecent().args[1] as any;
    expect(config.ariaLabel).toBe('Profil von Bob');
  });

  it('opens exactly one dialog per call', () => {
    service.open(makeUser());
    expect(dialogSpy.open).toHaveBeenCalledTimes(1);
  });
});
