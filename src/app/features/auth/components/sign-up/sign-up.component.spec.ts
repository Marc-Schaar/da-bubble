import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SignUpComponent } from './sign-up.component';
import { AuthService } from '../../services/auth/auth.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

describe('SignUpComponent', () => {
  let component: SignUpComponent;
  let fixture: ComponentFixture<SignUpComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['setStep1Data']) as any;
    navigationServiceSpy = jasmine.createSpyObj<NavigationService>('NavigationService', ['gotToAvatarSelection']) as any;

    await TestBed.configureTestingModule({
      imports: [SignUpComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NavigationService, useValue: navigationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SignUpComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('starts with an invalid form pre-filled with the default avatar photoURL', () => {
    expect(component.registerForm.invalid).toBe(true);
    expect(component.registerForm.value).toEqual({
      email: '',
      password: '',
      displayName: '',
      photoURL: 'img/avatar_default.png',
      acceptTerms: false,
    });
  });

  function fillValidForm() {
    component.registerForm.setValue({
      email: 'user@test.local',
      password: 'Secret1',
      displayName: 'Max Muster',
      photoURL: 'img/avatar_default.png',
      acceptTerms: true,
    });
  }

  describe('onSubmit', () => {
    it('marks all controls as touched and does not call the service or navigate when the form is invalid', () => {
      component.onSubmit();

      expect(component.registerForm.touched).toBe(true);
      expect(component.registerForm.controls['displayName'].touched).toBe(true);
      expect(authServiceSpy.setStep1Data).not.toHaveBeenCalled();
      expect(navigationServiceSpy.gotToAvatarSelection).not.toHaveBeenCalled();
    });

    it('passes the raw form value to authService.setStep1Data and navigates to avatar selection when valid', () => {
      fillValidForm();

      component.onSubmit();

      expect(authServiceSpy.setStep1Data).toHaveBeenCalledTimes(1);
      // KNOWN QUIRK: the form control is named "photoURL" while the RegisterData
      // model (and AuthService.setStep1Data's declared param type) expects
      // "photoUrl". getRawValue() returns `any`, so TS never catches the
      // mismatch; the field is effectively dead since avatar-selection later
      // supplies the real photo separately via completeRegistration(). Cast to
      // `any` here to assert the actual (mismatched) runtime shape.
      const [payload] = authServiceSpy.setStep1Data.calls.mostRecent().args;
      expect(payload as any).toEqual({
        email: 'user@test.local',
        password: 'Secret1',
        displayName: 'Max Muster',
        photoURL: 'img/avatar_default.png',
        acceptTerms: true,
      } as any);
      expect(navigationServiceSpy.gotToAvatarSelection).toHaveBeenCalled();
    });
  });

  describe('getDisplayNameError', () => {
    it('returns null while untouched and pristine, even if empty', () => {
      expect((component as any).getDisplayNameError()).toBeNull();
    });

    it('returns the message once touched and empty', () => {
      component.registerForm.controls['displayName'].markAsTouched();
      expect((component as any).getDisplayNameError()).toBe('Bitte schreiben Sie einen Namen. Mindestens 5 Zeichen');
    });

    it('returns the message once dirty and too short (< 5 chars)', () => {
      component.registerForm.controls['displayName'].setValue('Max');
      component.registerForm.controls['displayName'].markAsDirty();
      expect((component as any).getDisplayNameError()).toBe('Bitte schreiben Sie einen Namen. Mindestens 5 Zeichen');
    });

    it('returns null once a valid name (>= 5 chars) is entered', () => {
      component.registerForm.controls['displayName'].setValue('Max Muster');
      component.registerForm.controls['displayName'].markAsDirty();
      expect((component as any).getDisplayNameError()).toBeNull();
    });
  });

  describe('getEmailError', () => {
    it('returns null while untouched and pristine', () => {
      expect((component as any).getEmailError()).toBeNull();
    });

    it('returns the message once touched with an invalid email', () => {
      component.registerForm.controls['email'].setValue('not-an-email');
      component.registerForm.controls['email'].markAsTouched();
      expect((component as any).getEmailError()).toBe('*Diese E-Mail-Adresse ist leider ungültig.');
    });

    it('returns null once a valid email is entered', () => {
      component.registerForm.controls['email'].setValue('user@test.local');
      component.registerForm.controls['email'].markAsDirty();
      expect((component as any).getEmailError()).toBeNull();
    });
  });

  describe('getPasswordError', () => {
    it('returns null while untouched and pristine', () => {
      expect((component as any).getPasswordError()).toBeNull();
    });

    it('returns the message once dirty and failing the password pattern', () => {
      component.registerForm.controls['password'].setValue('abc');
      component.registerForm.controls['password'].markAsDirty();
      expect((component as any).getPasswordError()).toBe(
        'Bitte geben Sie ein Passwort ein. Es muss mindestens 6 Zeichen lang sein, einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten.',
      );
    });

    it('returns null once a valid password is entered', () => {
      component.registerForm.controls['password'].setValue('Secret1');
      component.registerForm.controls['password'].markAsDirty();
      expect((component as any).getPasswordError()).toBeNull();
    });
  });

  describe('template', () => {
    it('shows the terms-acceptance error only once the checkbox is touched/dirty and unchecked', () => {
      let errorEl: HTMLElement | null = fixture.nativeElement.querySelector('.legal-text + .error, span.error');
      expect(errorEl).toBeFalsy();

      component.registerForm.controls['acceptTerms'].markAsTouched();
      fixture.detectChanges();

      errorEl = fixture.nativeElement.querySelector('span.error');
      expect(errorEl?.textContent?.trim()).toBe('Du musst den Bedingungen zustimmen.');
    });

    it('submitting the form via ngSubmit triggers onSubmit', () => {
      spyOn(component, 'onSubmit');
      const form: HTMLFormElement = fixture.nativeElement.querySelector('form.form');
      form.dispatchEvent(new Event('submit'));
      expect(component.onSubmit).toHaveBeenCalled();
    });

    it('the back link points to /login', () => {
      const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a[aria-label="Zurück zum Login"]');
      expect(link.getAttribute('href')).toBe('/login');
    });
  });
});
