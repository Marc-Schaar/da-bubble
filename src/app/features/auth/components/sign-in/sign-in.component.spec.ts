import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SignInComponent } from './sign-in.component';
import { AuthService } from '../../services/auth/auth.service';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';

describe('SignInComponent', () => {
  let component: SignInComponent;
  let fixture: ComponentFixture<SignInComponent>;
  let authServiceSpy: jasmine.SpyObj<Omit<AuthService, 'isLoading' | 'errorMessage'>> & {
    isLoading: ReturnType<typeof mockSignal<boolean>>;
    errorMessage: ReturnType<typeof mockSignal<string | null>>;
  };

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'logInWithEmailAndPassword',
      'logInWithGoogle',
      'loginAsGuest',
    ]) as any;
    authServiceSpy.isLoading = mockSignal<boolean>(false);
    authServiceSpy.errorMessage = mockSignal<string | null>(null);
    authServiceSpy.logInWithEmailAndPassword.and.resolveTo(undefined);
    authServiceSpy.logInWithGoogle.and.resolveTo(undefined);
    authServiceSpy.loginAsGuest.and.resolveTo(undefined);

    await TestBed.configureTestingModule({
      imports: [SignInComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();

    fixture = TestBed.createComponent(SignInComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('starts with an empty, invalid login form', () => {
    expect(component.loginForm.value).toEqual({ email: '', password: '' });
    expect(component.loginForm.invalid).toBe(true);
  });

  describe('onSubmit', () => {
    it('with an invalid (empty) form, marks all controls as touched and does not call the service', async () => {
      await component.onSubmit();

      expect(component.loginForm.touched).toBe(true);
      expect(component.loginForm.controls['email'].touched).toBe(true);
      expect(component.loginForm.controls['password'].touched).toBe(true);
      expect(authServiceSpy.logInWithEmailAndPassword).not.toHaveBeenCalled();
    });

    it('calls authService.logInWithEmailAndPassword with the exact form values when valid', async () => {
      component.loginForm.setValue({ email: 'user@test.local', password: 'Secret1' });

      await component.onSubmit();

      expect(authServiceSpy.logInWithEmailAndPassword).toHaveBeenCalledOnceWith('user@test.local', 'Secret1');
    });
  });

  describe('signinwithgoogle', () => {
    it('calls authService.logInWithGoogle', () => {
      component.signinwithgoogle();
      expect(authServiceSpy.logInWithGoogle).toHaveBeenCalled();
    });
  });

  describe('guestLogin', () => {
    it('calls authService.loginAsGuest', () => {
      component.guestLogin();
      expect(authServiceSpy.loginAsGuest).toHaveBeenCalled();
    });

    it('resets formSubmitted, so validation messages from a prior submit attempt disappear', async () => {
      await component.onSubmit();
      expect((component as any).getEmailError()).toBe('*Bitte Email Adresse eingeben.');

      component.guestLogin();

      expect((component as any).getEmailError()).toBeNull();
      expect((component as any).getPasswordError()).toBeNull();
    });
  });

  describe('getEmailError', () => {
    it('returns null before any submit attempt, even if the field is empty', () => {
      expect((component as any).getEmailError()).toBeNull();
    });

    it('returns the required message after submit when email is empty', async () => {
      await component.onSubmit();
      expect((component as any).getEmailError()).toBe('*Bitte Email Adresse eingeben.');
    });

    it('returns the format message after submit when email fails the email validator', async () => {
      component.loginForm.controls['email'].setValue('not-an-email');
      await component.onSubmit();
      expect((component as any).getEmailError()).toBe('*Diese E-Mail Adresse ist leider ungültig.');
    });

    it('returns null after submit when email is valid', async () => {
      component.loginForm.controls['email'].setValue('user@test.local');
      component.loginForm.controls['password'].setValue('Secret1');
      await component.onSubmit();
      expect((component as any).getEmailError()).toBeNull();
    });
  });

  describe('getPasswordError', () => {
    it('returns null before any submit attempt, even if the field is empty', () => {
      expect((component as any).getPasswordError()).toBeNull();
    });

    it('returns the required message after submit when password is empty', async () => {
      await component.onSubmit();
      expect((component as any).getPasswordError()).toBe('*Bitte Password eingeben ');
    });

    it('KNOWN QUIRK: a non-empty but locally-invalid password (fails minLength/pattern) shows no message when the server has not errored — only the "required" case is explicitly handled', async () => {
      component.loginForm.controls['email'].setValue('user@test.local');
      component.loginForm.controls['password'].setValue('abc');
      await component.onSubmit();

      expect(component.loginForm.controls['password'].invalid).toBe(true);
      expect(component.loginForm.controls['password'].errors?.['required']).toBeFalsy();
      expect((component as any).getPasswordError()).toBeNull();
    });

    it('falls back to the server error message once formSubmitted and authService.errorMessage() is set, even though the field has a non-required local error', async () => {
      component.loginForm.controls['email'].setValue('user@test.local');
      component.loginForm.controls['password'].setValue('abc');
      await component.onSubmit();
      authServiceSpy.errorMessage.set('auth/invalid-credential');

      expect((component as any).getPasswordError()).toBe('*Falsches Passwort oder E-Mail.. Bitte noch einmal versuchen. ');
    });

    it('falls back to the server error message once the password is locally valid but the server reported an error', async () => {
      component.loginForm.setValue({ email: 'user@test.local', password: 'Secret1' });
      await component.onSubmit();
      authServiceSpy.errorMessage.set('auth/invalid-credential');

      expect((component as any).getPasswordError()).toBe('*Falsches Passwort oder E-Mail.. Bitte noch einmal versuchen. ');
    });

    it('returns null after submit when password is valid and there is no server error', async () => {
      component.loginForm.setValue({ email: 'user@test.local', password: 'Secret1' });
      await component.onSubmit();
      expect((component as any).getPasswordError()).toBeNull();
    });
  });

  describe('template', () => {
    it('disables all action buttons while authService.isLoading() is true', () => {
      authServiceSpy.isLoading.set(true);
      fixture.detectChanges();

      const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('app-button button'));
      expect(buttons.length).toBeGreaterThan(0);
      buttons.forEach((btn) => expect(btn.disabled).toBe(true));
    });

    it('clicking the google button calls signinwithgoogle', () => {
      spyOn(component, 'signinwithgoogle');
      const googleBtn: HTMLButtonElement = fixture.nativeElement.querySelector('.btn-google button');
      googleBtn.click();
      expect(component.signinwithgoogle).toHaveBeenCalled();
    });

    it('submitting the form via the submit button triggers onSubmit', () => {
      spyOn(component, 'onSubmit');
      const form: HTMLFormElement = fixture.nativeElement.querySelector('#loginForm');
      form.dispatchEvent(new Event('submit'));
      expect(component.onSubmit).toHaveBeenCalled();
    });
  });
});
