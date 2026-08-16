import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { HeaderUserMenuComponent } from './header-user-menu.component';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { AuthService } from '../../../features/auth/services/auth/auth.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { makeUser } from '../../../../testing/user-fixtures';
import { mockSignal } from '../../../../testing/signal-service-mock.util';

describe('HeaderUserMenuComponent', () => {
  let fixture: ComponentFixture<HeaderUserMenuComponent>;
  let component: HeaderUserMenuComponent;

  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
  let matDialogSpy: jasmine.SpyObj<MatDialog>;
  let bottomSheetSpy: jasmine.SpyObj<MatBottomSheet>;
  let isMobileSignal: ReturnType<typeof mockSignal<boolean>>;
  let currentUserSignal: ReturnType<typeof mockSignal<ReturnType<typeof makeUser> | null>>;

  beforeEach(async () => {
    isMobileSignal = mockSignal(false);
    currentUserSignal = mockSignal(makeUser({ displayName: 'Erika Musterfrau' }));

    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['logOut']);
    (authServiceSpy as any).currentUser = currentUserSignal;

    navigationServiceSpy = {} as jasmine.SpyObj<NavigationService>;
    (navigationServiceSpy as any).isMobile = isMobileSignal;

    matDialogSpy = jasmine.createSpyObj<MatDialog>('MatDialog', ['open', 'closeAll']);
    bottomSheetSpy = jasmine.createSpyObj<MatBottomSheet>('MatBottomSheet', ['open']);

    await TestBed.configureTestingModule({
      imports: [HeaderUserMenuComponent],
      providers: [
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: MatDialog, useValue: matDialogSpy },
        { provide: MatBottomSheet, useValue: bottomSheetSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderUserMenuComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders the current user displayName', () => {
    expect((fixture.nativeElement.textContent as string)).toContain('Erika Musterfrau');
  });

  describe('showProfile()', () => {
    it('opens MatDialog with UserProfileComponent and the expected config', () => {
      component.showProfile();

      expect(matDialogSpy.open).toHaveBeenCalledOnceWith(UserProfileComponent, {
        panelClass: 'user-profile-dialog-bottom-left',
        autoFocus: 'first-tabbable',
        restoreFocus: true,
        ariaLabel: 'Eigenes Profil',
      });
    });
  });

  describe('onMenuClosed()', () => {
    it('closes all open dialogs', () => {
      component.onMenuClosed();
      expect(matDialogSpy.closeAll).toHaveBeenCalledTimes(1);
    });
  });

  describe('onOpenMenu()', () => {
    it('opens the MatBottomSheet with UserMenuComponent when on mobile', () => {
      isMobileSignal.set(true);
      component.onOpenMenu();
      expect(bottomSheetSpy.open).toHaveBeenCalledOnceWith(UserMenuComponent as any);
    });

    it('does nothing when not on mobile', () => {
      isMobileSignal.set(false);
      component.onOpenMenu();
      expect(bottomSheetSpy.open).not.toHaveBeenCalled();
    });
  });

  describe('signOut()', () => {
    it('calls authService.logOut()', () => {
      component.signOut();
      expect(authServiceSpy.logOut).toHaveBeenCalledTimes(1);
    });
  });

  describe('template wiring', () => {
    it('clicking the trigger button calls onOpenMenu()', () => {
      spyOn(component, 'onOpenMenu');
      isMobileSignal.set(true);
      fixture.detectChanges();

      const trigger: HTMLButtonElement = fixture.nativeElement.querySelector('.menu__triger__btn button');
      trigger.click();

      expect(component.onOpenMenu).toHaveBeenCalledTimes(1);
    });

    it('hides the dropdown arrow icon on mobile', () => {
      isMobileSignal.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-icon')).toBeFalsy();
    });

    it('shows the dropdown arrow icon on desktop', () => {
      isMobileSignal.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('mat-icon')?.textContent?.trim()).toBe('keyboard_arrow_down');
    });
  });
});
