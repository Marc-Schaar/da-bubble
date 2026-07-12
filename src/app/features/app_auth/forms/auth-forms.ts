import { FormBuilder, FormGroup, Validators } from '@angular/forms';

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

export function createLoginForm(formBuilder: FormBuilder): FormGroup {
  return formBuilder.group(basicAuthFields());
}

export function createRegisterForm(formBuilder: FormBuilder): FormGroup {
  return formBuilder.group({
    ...basicAuthFields(),
    displayName: ['', [Validators.required, Validators.minLength(5)]],
    photoURL: ['img/avatar_default.png'],
    acceptTerms: [false, [Validators.requiredTrue]],
  });
}
