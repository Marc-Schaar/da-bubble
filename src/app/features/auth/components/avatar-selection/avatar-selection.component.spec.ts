import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AvatarSelectionComponent } from './avatar-selection.component';
import { AuthService } from '../../services/auth/auth.service';
import { DEFAULT_AVATAR, AVATAR_IMAGES } from '../../../../shared/constants';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';
import { makeUser } from '../../../../../testing/user-fixtures';

describe('AvatarSelectionComponent', () => {
  let component: AvatarSelectionComponent;
  let fixture: ComponentFixture<AvatarSelectionComponent>;
  let authServiceSpy: jasmine.SpyObj<Omit<AuthService, 'isLoading' | 'currentUser'>> & {
    isLoading: ReturnType<typeof mockSignal<boolean>>;
    currentUser: ReturnType<typeof mockSignal<ReturnType<typeof makeUser> | null>>;
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['completeRegistration', 'getUserName']) as any;
    authServiceSpy.isLoading = mockSignal<boolean>(false);
    authServiceSpy.currentUser = mockSignal<ReturnType<typeof makeUser> | null>(null);
    authServiceSpy.getUserName.and.returnValue('Pending Name');

    await TestBed.configureTestingModule({
      imports: [AvatarSelectionComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('starts with the default avatar selected', () => {
    expect(component.currentAvatar()).toBe(DEFAULT_AVATAR);
    const img: HTMLImageElement = fixture.nativeElement.querySelector('img.avatar-icon');
    expect(img.getAttribute('src')).toBe(DEFAULT_AVATAR);
  });

  describe('user name heading', () => {
    it('falls back to authService.getUserName() when currentUser() is null', () => {
      const heading: HTMLElement = fixture.nativeElement.querySelector('h2.user-name');
      expect(heading.textContent?.trim()).toBe('Pending Name');
    });

    it('prefers currentUser().displayName when set', () => {
      authServiceSpy.currentUser.set(makeUser({ displayName: 'Erika Musterfrau' }));
      fixture.detectChanges();

      const heading: HTMLElement = fixture.nativeElement.querySelector('h2.user-name');
      expect(heading.textContent?.trim()).toBe('Erika Musterfrau');
    });
  });

  describe('avatar picker interaction', () => {
    it('selecting an avatar in app-avatar-picker updates currentAvatar via the two-way model', () => {
      const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
        'app-avatar-picker .avatar-option',
      );
      expect(buttons.length).toBe(AVATAR_IMAGES.length);

      buttons[2].click();
      fixture.detectChanges();

      expect(component.currentAvatar()).toBe(AVATAR_IMAGES[2]);
      const img: HTMLImageElement = fixture.nativeElement.querySelector('img.avatar-icon');
      expect(img.getAttribute('src')).toBe(AVATAR_IMAGES[2]);
    });
  });

  describe('onSubmit', () => {
    it('calls authService.completeRegistration with the currently selected avatar', () => {
      const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll(
        'app-avatar-picker .avatar-option',
      );
      buttons[1].click();
      fixture.detectChanges();

      component.onSubmit();

      expect(authServiceSpy.completeRegistration).toHaveBeenCalledOnceWith(AVATAR_IMAGES[1]);
    });

    it('clicking the footer button triggers onSubmit with the default avatar when none was changed', () => {
      const footerBtn: HTMLButtonElement = fixture.nativeElement.querySelector('footer.footer button');
      footerBtn.click();

      expect(authServiceSpy.completeRegistration).toHaveBeenCalledOnceWith(DEFAULT_AVATAR);
    });
  });

  describe('loading state', () => {
    it('disables the footer button while authService.isLoading() is true', () => {
      authServiceSpy.isLoading.set(true);
      fixture.detectChanges();

      const footerBtn: HTMLButtonElement = fixture.nativeElement.querySelector('footer.footer button');
      expect(footerBtn.disabled).toBe(true);
    });

    it('leaves the footer button enabled while not loading', () => {
      const footerBtn: HTMLButtonElement = fixture.nativeElement.querySelector('footer.footer button');
      expect(footerBtn.disabled).toBe(false);
    });
  });

  it('the back link points to /register', () => {
    const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.back-link');
    expect(link.getAttribute('href')).toBe('/register');
  });
});
