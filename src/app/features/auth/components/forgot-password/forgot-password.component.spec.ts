import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';

import { ForgotPasswordComponent } from './forgot-password.component';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService } from '../../../../shared/services/notification/notification.service';

describe('ForgotPasswordComponent', () => {
  let component: ForgotPasswordComponent;
  let fixture: ComponentFixture<ForgotPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;

  beforeEach(async () => {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', ['sendPasswordReset']) as any;
    notificationServiceSpy = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']) as any;
    authServiceSpy.sendPasswordReset.and.resolveTo(undefined);

    await TestBed.configureTestingModule({
      imports: [ForgotPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ForgotPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('starts with an empty, invalid form and isSubmitting false', () => {
    expect(component.forgotPasswordForm.invalid).toBe(true);
    expect(component.isSubmitting()).toBe(false);
  });

  describe('onSubmit', () => {
    it('marks the form as touched and does not call the service when invalid', async () => {
      await component.onSubmit();

      expect(component.forgotPasswordForm.touched).toBe(true);
      expect(authServiceSpy.sendPasswordReset).not.toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });

    it('calls authService.sendPasswordReset with the entered email, shows a success toast, and resets the form', async () => {
      component.forgotPasswordForm.controls['email'].setValue('user@test.local');

      await component.onSubmit();

      expect(authServiceSpy.sendPasswordReset).toHaveBeenCalledOnceWith('user@test.local');
      expect(notificationServiceSpy.success).toHaveBeenCalledOnceWith('E-Mail gesendet');
      expect(notificationServiceSpy.error).not.toHaveBeenCalled();
      expect(component.forgotPasswordForm.controls['email'].value).toBeFalsy();
      expect(component.isSubmitting()).toBe(false);
    });

    it('sets isSubmitting true while the request is in flight', async () => {
      let resolveReset!: () => void;
      authServiceSpy.sendPasswordReset.and.returnValue(
        new Promise<void>((resolve) => {
          resolveReset = resolve;
        }),
      );
      component.forgotPasswordForm.controls['email'].setValue('user@test.local');

      const submitPromise = component.onSubmit();
      expect(component.isSubmitting()).toBe(true);

      resolveReset();
      await submitPromise;

      expect(component.isSubmitting()).toBe(false);
    });

    it('shows an error toast and does not reset the form when the service call rejects', async () => {
      authServiceSpy.sendPasswordReset.and.rejectWith(new Error('network down'));
      component.forgotPasswordForm.controls['email'].setValue('user@test.local');

      await component.onSubmit();

      expect(notificationServiceSpy.error).toHaveBeenCalledOnceWith('E-Mail konnte nicht gesendet werden.');
      expect(notificationServiceSpy.success).not.toHaveBeenCalled();
      expect(component.forgotPasswordForm.controls['email'].value).toBe('user@test.local');
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('getEmailError', () => {
    it('returns null while untouched and pristine', () => {
      expect((component as any).getEmailError()).toBeNull();
    });

    it('returns the message once touched with an invalid email', () => {
      component.forgotPasswordForm.controls['email'].setValue('not-an-email');
      component.forgotPasswordForm.controls['email'].markAsTouched();
      expect((component as any).getEmailError()).toBe('*Diese E-Mail-Adresse ist leider ungültig.');
    });

    it('returns null once a valid email is entered', () => {
      component.forgotPasswordForm.controls['email'].setValue('user@test.local');
      component.forgotPasswordForm.controls['email'].markAsDirty();
      expect((component as any).getEmailError()).toBeNull();
    });
  });

  describe('template', () => {
    it('the submit button is disabled while the form is invalid', () => {
      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn.disabled).toBe(true);
    });

    it('the submit button becomes enabled once the form is valid', () => {
      component.forgotPasswordForm.controls['email'].setValue('user@test.local');
      fixture.detectChanges();

      const btn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(btn.disabled).toBe(false);
    });

    it('the back button (app-button with routerLink) points to /', () => {
      // app-button's host element is not an <a>, so RouterLink never writes an
      // href attribute here — assert against the directive's resolved urlTree instead.
      const routerLinkDe = fixture.debugElement.query(By.directive(RouterLink));
      const routerLinkInstance = routerLinkDe.injector.get(RouterLink);
      expect(routerLinkInstance.urlTree?.toString()).toBe('/');
    });

    it('submitting the form via ngSubmit triggers onSubmit', () => {
      spyOn(component, 'onSubmit');
      const form: HTMLFormElement = fixture.nativeElement.querySelector('form.password-form');
      form.dispatchEvent(new Event('submit'));
      expect(component.onSubmit).toHaveBeenCalled();
    });
  });
});
