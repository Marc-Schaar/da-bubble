import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter, Router, RouterLink } from '@angular/router';
import { By } from '@angular/platform-browser';

import { ResetPasswordComponent } from './reset-password.component';
import { AuthService } from '../../services/auth/auth.service';
import { NotificationService } from '../../../../shared/services/notification/notification.service';
import { stubActivatedRoute } from '../../../../../testing/router-test.util';

describe('ResetPasswordComponent', () => {
  let component: ResetPasswordComponent;
  let fixture: ComponentFixture<ResetPasswordComponent>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let notificationServiceSpy: jasmine.SpyObj<NotificationService>;
  let router: Router;
  let routerSpy: jasmine.Spy;

  /**
   * Configures a fresh TestBed with the given query params and verification
   * outcome, then creates the component and lets ngOnInit's async
   * verifyPasswordResetCode call settle.
   */
  async function createComponent(
    queryParams: Record<string, string> = { oobCode: 'valid-code' },
    verify: 'resolve' | 'reject' = 'resolve',
  ): Promise<void> {
    authServiceSpy = jasmine.createSpyObj<AuthService>('AuthService', [
      'verifyPasswordResetCode',
      'confirmPasswordReset',
    ]) as any;
    notificationServiceSpy = jasmine.createSpyObj<NotificationService>('NotificationService', ['success', 'error']) as any;

    if (verify === 'resolve') {
      authServiceSpy.verifyPasswordResetCode.and.resolveTo('user@test.local');
    } else {
      authServiceSpy.verifyPasswordResetCode.and.rejectWith(new Error('expired'));
    }
    authServiceSpy.confirmPasswordReset.and.resolveTo(undefined);

    await TestBed.configureTestingModule({
      imports: [ResetPasswordComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: authServiceSpy },
        { provide: NotificationService, useValue: notificationServiceSpy },
        { provide: ActivatedRoute, useValue: stubActivatedRoute({}, queryParams) },
      ],
    }).compileComponents();

    // Use the real Router (needed so RouterLink's urlTree getter, exercised by
    // the back-button template test, has a working createUrlTree) but spy on
    // navigate so onSubmit's redirect calls can be asserted without actually navigating.
    router = TestBed.inject(Router);
    routerSpy = spyOn(router, 'navigate').and.resolveTo(true);

    fixture = TestBed.createComponent(ResetPasswordComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  it('creates', async () => {
    await createComponent();
    expect(component).toBeTruthy();
  });

  describe('ngOnInit / oobCode verification', () => {
    it('reads the oobCode from the query params and verifies it, keeping isCodeValid true on success', async () => {
      await createComponent({ oobCode: 'my-code-123' }, 'resolve');

      expect(component.resetCode).toBe('my-code-123');
      expect(authServiceSpy.verifyPasswordResetCode).toHaveBeenCalledOnceWith('my-code-123');
      expect(component.isCodeValid()).toBe(true);
      expect(fixture.nativeElement.querySelector('.box')).toBeTruthy();
    });

    it('uses an empty string when no oobCode query param is present', async () => {
      await createComponent({}, 'resolve');

      expect(component.resetCode).toBe('');
      expect(authServiceSpy.verifyPasswordResetCode).toHaveBeenCalledOnceWith('');
    });

    it('sets isCodeValid to false and shows the invalid-code message when verification rejects', async () => {
      await createComponent({ oobCode: 'expired-code' }, 'reject');

      expect(component.isCodeValid()).toBe(false);
      expect(fixture.nativeElement.querySelector('.box')).toBeFalsy();
      const errorText: HTMLElement = fixture.nativeElement.querySelector('p.error');
      expect(errorText?.textContent?.trim()).toBe('Aktueller Code ungültig. Bitte neuen Code anfordern');
    });
  });

  describe('onSubmit', () => {
    it('marks the form as touched and does not confirm the reset when the form is invalid and the code is valid', async () => {
      await createComponent();

      await component.onSubmit();

      expect(component.resetPasswordForm.touched).toBe(true);
      expect(authServiceSpy.confirmPasswordReset).not.toHaveBeenCalled();
      expect(routerSpy).not.toHaveBeenCalled();
    });

    it('redirects to /forgot-password without confirming when the code is invalid, even if the form is valid', async () => {
      await createComponent({ oobCode: 'bad' }, 'reject');
      component.resetPasswordForm.setValue({ password: 'Secret1', passwordConfirm: 'Secret1' });

      await component.onSubmit();

      expect(routerSpy).toHaveBeenCalledOnceWith(['/forgot-password']);
      expect(authServiceSpy.confirmPasswordReset).not.toHaveBeenCalled();
    });

    it('confirms the reset with resetCode + password, shows a success toast, and resets the form on success', async () => {
      await createComponent({ oobCode: 'good-code' }, 'resolve');
      component.resetPasswordForm.setValue({ password: 'Secret1', passwordConfirm: 'Secret1' });

      await component.onSubmit();

      expect(authServiceSpy.confirmPasswordReset).toHaveBeenCalledOnceWith('good-code', 'Secret1');
      expect(notificationServiceSpy.success).toHaveBeenCalledOnceWith('Passwort geändert');
      expect(component.resetPasswordForm.controls['password'].value).toBeFalsy();
      expect(component.isSubmitting()).toBe(false);
    });

    it('navigates to / about 1500ms after a successful reset', async () => {
      await createComponent({ oobCode: 'good-code' }, 'resolve');
      component.resetPasswordForm.setValue({ password: 'Secret1', passwordConfirm: 'Secret1' });

      await component.onSubmit();
      expect(routerSpy).not.toHaveBeenCalledWith(['/']);

      await new Promise((resolve) => setTimeout(resolve, 1600));

      expect(routerSpy).toHaveBeenCalledWith(['/']);
    });

    it('marks the code invalid and does not navigate when confirmPasswordReset rejects', async () => {
      await createComponent({ oobCode: 'good-code' }, 'resolve');
      authServiceSpy.confirmPasswordReset.and.rejectWith(new Error('expired mid-flight'));
      component.resetPasswordForm.setValue({ password: 'Secret1', passwordConfirm: 'Secret1' });

      await component.onSubmit();

      expect(component.isCodeValid()).toBe(false);
      expect(notificationServiceSpy.success).not.toHaveBeenCalled();
      expect(routerSpy).not.toHaveBeenCalled();
      expect(component.isSubmitting()).toBe(false);
    });
  });

  describe('getPasswordError', () => {
    it('returns null while untouched and pristine', async () => {
      await createComponent();
      expect((component as any).getPasswordError()).toBeNull();
    });

    it('returns the message once dirty and failing the password pattern', async () => {
      await createComponent();
      component.resetPasswordForm.controls['password'].setValue('abc');
      component.resetPasswordForm.controls['password'].markAsDirty();
      expect((component as any).getPasswordError()).toBe(
        'Das Passwort muss mindestens 6 Zeichen lang sein und einen Großbuchstaben, einen Kleinbuchstaben und eine Zahl enthalten.',
      );
    });

    it('returns null once a valid password is entered', async () => {
      await createComponent();
      component.resetPasswordForm.controls['password'].setValue('Secret1');
      component.resetPasswordForm.controls['password'].markAsDirty();
      expect((component as any).getPasswordError()).toBeNull();
    });
  });

  describe('getPasswordConfirmError', () => {
    it('returns null while passwordConfirm is untouched, even if the passwords mismatch', async () => {
      await createComponent();
      component.resetPasswordForm.setValue({ password: 'Secret1', passwordConfirm: 'Different1' });
      expect((component as any).getPasswordConfirmError()).toBeNull();
    });

    it('returns the mismatch message once passwordConfirm is touched and the values differ', async () => {
      await createComponent();
      component.resetPasswordForm.setValue({ password: 'Secret1', passwordConfirm: 'Different1' });
      component.resetPasswordForm.controls['passwordConfirm'].markAsTouched();
      expect((component as any).getPasswordConfirmError()).toBe('Die Passwörter stimmen nicht überein.');
    });

    it('returns null once passwordConfirm is touched and the values match', async () => {
      await createComponent();
      component.resetPasswordForm.setValue({ password: 'Secret1', passwordConfirm: 'Secret1' });
      component.resetPasswordForm.controls['passwordConfirm'].markAsTouched();
      expect((component as any).getPasswordConfirmError()).toBeNull();
    });
  });

  describe('template', () => {
    it('renders the two password inputs and submit button when the code is valid', async () => {
      await createComponent();
      const inputs = fixture.nativeElement.querySelectorAll('app-input');
      expect(inputs.length).toBe(2);
      const submitBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button[type="submit"]');
      expect(submitBtn).toBeTruthy();
    });

    it('renders only the invalid-code message and a single button when the code is invalid', async () => {
      await createComponent({ oobCode: 'bad' }, 'reject');
      const inputs = fixture.nativeElement.querySelectorAll('app-input');
      expect(inputs.length).toBe(0);
      const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('button[type="submit"]');
      expect(buttons.length).toBe(1);
    });

    it('the back button (app-button with routerLink) points to /main', async () => {
      await createComponent();
      // app-button's host element is not an <a>, so RouterLink never writes an
      // href attribute here — assert against the directive's resolved urlTree instead.
      const routerLinkDe = fixture.debugElement.query(By.directive(RouterLink));
      const routerLinkInstance = routerLinkDe.injector.get(RouterLink);
      expect(routerLinkInstance.urlTree?.toString()).toBe('/main');
    });

    it('submitting the form via ngSubmit triggers onSubmit', async () => {
      await createComponent();
      spyOn(component, 'onSubmit');
      const form: HTMLFormElement = fixture.nativeElement.querySelector('form.password-form');
      form.dispatchEvent(new Event('submit'));
      expect(component.onSubmit).toHaveBeenCalled();
    });
  });
});
