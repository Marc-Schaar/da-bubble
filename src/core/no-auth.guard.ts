import { inject } from '@angular/core';
import { Auth, onAuthStateChanged } from '@angular/fire/auth';
import { CanActivateFn, Router } from '@angular/router';

/**
 * Reverse of authGuard: keeps already logged-in users out of the auth
 * screens (login/register/...) by bouncing them straight to the chat.
 */
export const noAuthGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  const auth = inject(Auth);

  return new Promise((resolve) => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      unsubscribe();
      if (user) {
        router.navigate(['/main']);
        resolve(false);
      } else {
        resolve(true);
      }
    });
  });
};
