import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheetRef } from '@angular/material/bottom-sheet';

import { UserMenuComponent } from './user-menu.component';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { AuthService } from '../../../features/auth/services/auth/auth.service';

describe('UserMenuComponent', () => {
  let component: UserMenuComponent;
  let fixture: ComponentFixture<UserMenuComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;
  let bottomSheetRefSpy: jasmine.SpyObj<MatBottomSheetRef<UserMenuComponent>>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logOut']);
    matDialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open']);
    bottomSheetRefSpy = jasmine.createSpyObj<MatBottomSheetRef<UserMenuComponent>>('MatBottomSheetRef', ['dismiss']);

    await TestBed.configureTestingModule({
      imports: [UserMenuComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: MatBottomSheetRef, useValue: bottomSheetRefSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(UserMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders a "Profile" button and a "Log Out" button', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Profile');
    expect(text).toContain('Log Out');
  });

  it('clicking the "Profile" button opens the UserProfileComponent dialog with the expected config', () => {
    const buttons: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('app-button');
    const profileButton = Array.from(buttons).find((btn) => btn.textContent?.includes('Profile'))!;
    profileButton.querySelector('button')!.click();

    expect(matDialogSpy.open).toHaveBeenCalledOnceWith(UserProfileComponent, {
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabel: 'Eigenes Profil',
    });
  });

  it('clicking the "Log Out" button calls authService.logOut() and dismisses the bottom sheet', () => {
    const buttons: NodeListOf<HTMLElement> = fixture.nativeElement.querySelectorAll('app-button');
    const logoutButton = Array.from(buttons).find((btn) => btn.textContent?.includes('Log Out'))!;
    logoutButton.querySelector('button')!.click();

    expect(authServiceSpy.logOut).toHaveBeenCalledTimes(1);
    expect(bottomSheetRefSpy.dismiss).toHaveBeenCalledTimes(1);
  });

  it('calling showProfile() directly opens the dialog exactly once', () => {
    component.showProfile();
    expect(matDialogSpy.open).toHaveBeenCalledTimes(1);
  });

  it('calling logOut() directly logs out and dismisses exactly once', () => {
    component.logOut();
    expect(authServiceSpy.logOut).toHaveBeenCalledTimes(1);
    expect(bottomSheetRefSpy.dismiss).toHaveBeenCalledTimes(1);
  });
});
