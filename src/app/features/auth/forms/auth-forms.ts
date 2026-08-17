import { AbstractControl, FormBuilder, FormGroup, ValidationErrors, Validators } from '@angular/forms';

export const PASSWORD_PATTERN = '^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d).{6,}$';

/**
 * Shared email/password controls used by login and registration.
 */
function basicAuthFields() {
  return {
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(PASSWORD_PATTERN)]],
  };
}

/**
 * Creates the login form group for the sign-in screen.
 * Only requires a non-empty password — complexity is irrelevant here since
 * the server is the source of truth for whether existing credentials match.
 */
export function createLoginForm(formBuilder: FormBuilder): FormGroup {
  return formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required]],
  });
}

/**
 * Creates the forgot-password form group used to request a password reset.
 */
export function createForgotPasswordForm(formBuilder: FormBuilder): FormGroup {
  return formBuilder.group({
    email: ['', [Validators.required, Validators.email]],
  });
}

/**
 * Creates the registration form group used when a new user signs up.
 */
export function createRegisterForm(formBuilder: FormBuilder): FormGroup {
  return formBuilder.group({
    ...basicAuthFields(),
    displayName: ['', [Validators.required, Validators.minLength(5)]],
    photoURL: ['img/avatar_default.png'],
    acceptTerms: [false, [Validators.requiredTrue]],
  });
}

/**
 * Validates that password and password confirmation fields contain the same value.
 * Stays quiet while `passwordConfirm` is still empty so the `required` validator
 * owns that state — otherwise a not-yet-touched confirm field would flash a
 * "passwords don't match" error the moment the password field is filled in.
 */
function passwordsMatch(group: AbstractControl): ValidationErrors | null {
  const password = group.get('password')?.value;
  const passwordConfirm = group.get('passwordConfirm')?.value;
  if (!passwordConfirm) return null;
  return password === passwordConfirm ? null : { passwordMismatch: true };
}

/**
 * Creates the reset-password form group and attaches the password match validator.
 */
export function createResetPasswordForm(formBuilder: FormBuilder): FormGroup {
  return formBuilder.group(
    {
      password: ['', [Validators.required, Validators.minLength(6), Validators.pattern(PASSWORD_PATTERN)]],
      passwordConfirm: ['', [Validators.required]],
    },
    { validators: passwordsMatch },
  );
}
