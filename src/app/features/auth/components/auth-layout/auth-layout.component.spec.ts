import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { AuthLayoutComponent } from './auth-layout.component';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { AuthService } from '../../services/auth/auth.service';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';

describe('AuthLayoutComponent', () => {
  let component: AuthLayoutComponent;
  let fixture: ComponentFixture<AuthLayoutComponent>;
  let navigationServiceSpy: {
    isMobile: ReturnType<typeof mockSignal<boolean>>;
    isSignUpPage: ReturnType<typeof mockSignal<boolean>>;
    isPasswordPage: ReturnType<typeof mockSignal<boolean>>;
  };
  let authServiceSpy: { currentUser: ReturnType<typeof mockSignal<null>> };

  beforeEach(async () => {
    sessionStorage.removeItem('showIntro');

    navigationServiceSpy = {
      isMobile: mockSignal<boolean>(false),
      isSignUpPage: mockSignal<boolean>(false),
      isPasswordPage: mockSignal<boolean>(false),
    };
    authServiceSpy = { currentUser: mockSignal<null>(null) };

    await TestBed.configureTestingModule({
      imports: [AuthLayoutComponent],
      providers: [
        provideRouter([]),
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
      ],
    }).compileComponents();
  });

  afterEach(() => {
    sessionStorage.removeItem('showIntro');
  });

  function createComponent(): void {
    fixture = TestBed.createComponent(AuthLayoutComponent);
    component = fixture.componentInstance;
  }

  it('creates', () => {
    createComponent();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders app-header, the router-outlet inside .auth-card, and app-footer', () => {
    createComponent();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('app-header')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.auth-card router-outlet')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('app-footer')).toBeTruthy();
  });

  describe('showIntro / ngOnInit', () => {
    it('shows the intro on init when not the password page and not seen this session', () => {
      createComponent();
      fixture.detectChanges();

      expect(component.showIntro()).toBe(true);
      expect(fixture.nativeElement.querySelector('app-intro')).toBeTruthy();
    });

    it('does not show the intro when navigationService.isPasswordPage() is true', () => {
      navigationServiceSpy.isPasswordPage.set(true);
      createComponent();
      fixture.detectChanges();

      expect(component.showIntro()).toBe(false);
      expect(fixture.nativeElement.querySelector('app-intro')).toBeFalsy();
    });

    it('does not show the intro when it was already marked as seen this session', () => {
      sessionStorage.setItem('showIntro', 'false');
      createComponent();
      fixture.detectChanges();

      expect(component.showIntro()).toBe(false);
      expect(fixture.nativeElement.querySelector('app-intro')).toBeFalsy();
    });

    it('hides the intro and marks it as seen in sessionStorage after 4 seconds', fakeAsync(() => {
      createComponent();
      fixture.detectChanges();
      expect(component.showIntro()).toBe(true);

      tick(4000);
      fixture.detectChanges();

      expect(component.showIntro()).toBe(false);
      expect(sessionStorage.getItem('showIntro')).toBe('false');
      expect(fixture.nativeElement.querySelector('app-intro')).toBeFalsy();
    }));

    it('does not schedule the auto-hide timer at all when the intro is never shown (password page)', fakeAsync(() => {
      navigationServiceSpy.isPasswordPage.set(true);
      createComponent();
      fixture.detectChanges();

      tick(4000);
      fixture.detectChanges();

      // Still false, and sessionStorage was never written by markIntroAsSeen.
      expect(component.showIntro()).toBe(false);
      expect(sessionStorage.getItem('showIntro')).toBeNull();
    }));
  });

  describe('header sign-up box (desktop only)', () => {
    it('renders app-sign-up-box[headerActions] inside app-header when not mobile', () => {
      navigationServiceSpy.isMobile.set(false);
      createComponent();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-header app-sign-up-box')).toBeTruthy();
    });

    it('omits the header sign-up box when mobile', () => {
      navigationServiceSpy.isMobile.set(true);
      createComponent();
      fixture.detectChanges();

      expect(fixture.nativeElement.querySelector('app-header app-sign-up-box')).toBeFalsy();
    });
  });

  describe('standalone mobile sign-up box', () => {
    it('renders the standalone app-sign-up-box when mobile and not the sign-up page', () => {
      navigationServiceSpy.isMobile.set(true);
      navigationServiceSpy.isSignUpPage.set(false);
      createComponent();
      fixture.detectChanges();

      const boxes = fixture.nativeElement.querySelectorAll('main > app-sign-up-box');
      expect(boxes.length).toBe(1);
    });

    it('omits the standalone box when mobile but on the sign-up page', () => {
      navigationServiceSpy.isMobile.set(true);
      navigationServiceSpy.isSignUpPage.set(true);
      createComponent();
      fixture.detectChanges();

      const boxes = fixture.nativeElement.querySelectorAll('main > app-sign-up-box');
      expect(boxes.length).toBe(0);
    });

    it('omits the standalone box when not mobile, regardless of isSignUpPage', () => {
      navigationServiceSpy.isMobile.set(false);
      navigationServiceSpy.isSignUpPage.set(false);
      createComponent();
      fixture.detectChanges();

      const boxes = fixture.nativeElement.querySelectorAll('main > app-sign-up-box');
      expect(boxes.length).toBe(0);
    });
  });
});
