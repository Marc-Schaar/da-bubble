import { FormBuilder } from '@angular/forms';
import { createLoginForm, createRegisterForm, createForgotPasswordForm, createResetPasswordForm, PASSWORD_PATTERN } from './auth-forms';

describe('auth-forms', () => {
  let fb: FormBuilder;

  beforeEach(() => {
    fb = new FormBuilder();
  });

  describe('PASSWORD_PATTERN', () => {
    const regex = new RegExp(PASSWORD_PATTERN);

    it('rejects a password missing an uppercase letter', () => {
      expect(regex.test('abcdef1')).toBeFalse();
    });

    it('rejects a password missing a lowercase letter', () => {
      expect(regex.test('ABCDEF1')).toBeFalse();
    });

    it('rejects a password missing a digit', () => {
      expect(regex.test('Abcdefg')).toBeFalse();
    });

    it('rejects a password shorter than 6 characters', () => {
      expect(regex.test('Ab1')).toBeFalse();
    });

    it('accepts a password with upper, lower, digit and length >= 6', () => {
      expect(regex.test('Abcdef1')).toBeTrue();
    });

    it('accepts a longer valid password', () => {
      expect(regex.test('SuperSecret123')).toBeTrue();
    });
  });

  describe('createLoginForm', () => {
    it('is invalid initially', () => {
      const form = createLoginForm(fb);
      expect(form.valid).toBeFalse();
    });

    it('has the expected controls with empty initial values', () => {
      const form = createLoginForm(fb);
      expect(form.get('email')?.value).toBe('');
      expect(form.get('password')?.value).toBe('');
    });

    it('email is required', () => {
      const form = createLoginForm(fb);
      const email = form.get('email')!;
      expect(email.hasError('required')).toBeTrue();
      email.setValue('a@b.com');
      expect(email.hasError('required')).toBeFalse();
    });

    it('email must be a valid email format', () => {
      const form = createLoginForm(fb);
      const email = form.get('email')!;
      email.setValue('not-an-email');
      expect(email.hasError('email')).toBeTrue();
      email.setValue('valid@example.com');
      expect(email.hasError('email')).toBeFalse();
    });

    it('password is required, but has no complexity requirements', () => {
      const form = createLoginForm(fb);
      const password = form.get('password')!;
      expect(password.hasError('required')).toBeTrue();
      password.setValue('anything');
      expect(password.hasError('required')).toBeFalse();
      expect(password.hasError('minlength')).toBeFalse();
      expect(password.hasError('pattern')).toBeFalse();
    });

    it('is valid when both fields are filled, regardless of password complexity', () => {
      const form = createLoginForm(fb);
      form.get('email')!.setValue('a@b.com');
      form.get('password')!.setValue('anything');
      expect(form.valid).toBeTrue();
    });
  });

  describe('createForgotPasswordForm', () => {
    it('is invalid initially', () => {
      const form = createForgotPasswordForm(fb);
      expect(form.valid).toBeFalse();
    });

    it('email is required', () => {
      const form = createForgotPasswordForm(fb);
      const email = form.get('email')!;
      expect(email.hasError('required')).toBeTrue();
    });

    it('email must be a valid email format', () => {
      const form = createForgotPasswordForm(fb);
      const email = form.get('email')!;
      email.setValue('not-an-email');
      expect(email.hasError('email')).toBeTrue();
    });

    it('is valid with a correct email', () => {
      const form = createForgotPasswordForm(fb);
      form.get('email')!.setValue('a@b.com');
      expect(form.valid).toBeTrue();
    });
  });

  describe('createRegisterForm', () => {
    it('is invalid initially', () => {
      const form = createRegisterForm(fb);
      expect(form.valid).toBeFalse();
    });

    it('has the expected default values', () => {
      const form = createRegisterForm(fb);
      expect(form.get('email')?.value).toBe('');
      expect(form.get('password')?.value).toBe('');
      expect(form.get('displayName')?.value).toBe('');
      expect(form.get('photoURL')?.value).toBe('img/avatar_default.png');
      expect(form.get('acceptTerms')?.value).toBeFalse();
    });

    it('email is required and validated', () => {
      const form = createRegisterForm(fb);
      const email = form.get('email')!;
      expect(email.hasError('required')).toBeTrue();
      email.setValue('bad-email');
      expect(email.hasError('email')).toBeTrue();
      email.setValue('a@b.com');
      expect(email.valid).toBeTrue();
    });

    it('password is required, minLength(6) and pattern validated', () => {
      const form = createRegisterForm(fb);
      const password = form.get('password')!;
      expect(password.hasError('required')).toBeTrue();
      password.setValue('Ab1');
      expect(password.hasError('minlength')).toBeTrue();
      password.setValue('alllowercase1');
      expect(password.hasError('pattern')).toBeTrue();
      password.setValue('Abcdef1');
      expect(password.valid).toBeTrue();
    });

    it('displayName is required with minLength(5)', () => {
      const form = createRegisterForm(fb);
      const displayName = form.get('displayName')!;
      expect(displayName.hasError('required')).toBeTrue();
      displayName.setValue('Bob');
      expect(displayName.hasError('minlength')).toBeTrue();
      displayName.setValue('Bobby');
      expect(displayName.valid).toBeTrue();
    });

    it('acceptTerms requires true (requiredTrue)', () => {
      const form = createRegisterForm(fb);
      const acceptTerms = form.get('acceptTerms')!;
      expect(acceptTerms.hasError('required')).toBeTrue();
      acceptTerms.setValue(false);
      expect(acceptTerms.hasError('required')).toBeTrue();
      acceptTerms.setValue(true);
      expect(acceptTerms.valid).toBeTrue();
    });

    it('is valid when all fields are filled correctly', () => {
      const form = createRegisterForm(fb);
      form.get('email')!.setValue('a@b.com');
      form.get('password')!.setValue('Abcdef1');
      form.get('displayName')!.setValue('Bobby');
      form.get('acceptTerms')!.setValue(true);
      expect(form.valid).toBeTrue();
    });
  });

  describe('createResetPasswordForm', () => {
    it('is invalid initially', () => {
      const form = createResetPasswordForm(fb);
      expect(form.valid).toBeFalse();
    });

    it('password is required, minLength(6) and pattern validated', () => {
      const form = createResetPasswordForm(fb);
      const password = form.get('password')!;
      expect(password.hasError('required')).toBeTrue();
      password.setValue('Ab1');
      expect(password.hasError('minlength')).toBeTrue();
      password.setValue('alllowercase1');
      expect(password.hasError('pattern')).toBeTrue();
      password.setValue('Abcdef1');
      expect(password.valid).toBeTrue();
    });

    it('passwordConfirm is required', () => {
      const form = createResetPasswordForm(fb);
      const passwordConfirm = form.get('passwordConfirm')!;
      expect(passwordConfirm.hasError('required')).toBeTrue();
      passwordConfirm.setValue('Abcdef1');
      expect(passwordConfirm.hasError('required')).toBeFalse();
    });

    it('is valid (no passwordMismatch error) when password and passwordConfirm match', () => {
      const form = createResetPasswordForm(fb);
      form.get('password')!.setValue('Abcdef1');
      form.get('passwordConfirm')!.setValue('Abcdef1');
      expect(form.valid).toBeTrue();
      expect(form.hasError('passwordMismatch')).toBeFalse();
    });

    it('sets a passwordMismatch error on the group when passwords differ', () => {
      const form = createResetPasswordForm(fb);
      form.get('password')!.setValue('Abcdef1');
      form.get('passwordConfirm')!.setValue('Different1');
      expect(form.hasError('passwordMismatch')).toBeTrue();
      expect(form.valid).toBeFalse();
    });

    it('when both password and passwordConfirm are empty, the group-level passwordsMatch validator stays quiet and lets the required validators fail individually', () => {
      const form = createResetPasswordForm(fb);
      expect(form.hasError('passwordMismatch')).toBeFalse();
      expect(form.get('password')?.hasError('required')).toBeTrue();
      expect(form.get('passwordConfirm')?.hasError('required')).toBeTrue();
      expect(form.valid).toBeFalse();
    });

    it('does not set passwordMismatch while passwordConfirm is still empty, even if password is already filled in', () => {
      const form = createResetPasswordForm(fb);
      form.get('password')!.setValue('Abcdef1');
      expect(form.hasError('passwordMismatch')).toBeFalse();
      expect(form.get('passwordConfirm')?.hasError('required')).toBeTrue();
      expect(form.valid).toBeFalse();
    });
  });
});
