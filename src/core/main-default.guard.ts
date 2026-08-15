import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

/**
 * On desktop, /main alone has nothing to show, so send the user straight to
 * new-message. On mobile, /main is the contact list itself (rendered by
 * MainChatComponent when the URL is exactly /main), so no redirect happens.
 */
export const mainDefaultGuard: CanActivateFn = () => {
  const router = inject(Router);
  const isMobile = window.innerWidth < 1024;

  return isMobile ? true : router.parseUrl('/main/new-message');
};
