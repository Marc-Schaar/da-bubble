import { Route } from '@angular/router';
import { routes } from './app.routes';
import { authGuard } from './auth.guard';
import { noAuthGuard } from './no-auth.guard';
import { mainDefaultGuard } from './main-default.guard';

import { AuthLayoutComponent } from '../app/features/auth/components/auth-layout/auth-layout.component';
import { SignInComponent } from '../app/features/auth/components/sign-in/sign-in.component';
import { SignUpComponent } from '../app/features/auth/components/sign-up/sign-up.component';
import { AvatarSelectionComponent } from '../app/features/auth/components/avatar-selection/avatar-selection.component';
import { ForgotPasswordComponent } from '../app/features/auth/components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '../app/features/auth/components/reset-password/reset-password.component';
import { MainChatComponent } from '../app/features/chat/main-chat/main-chat.component';
import { ChatContentComponent } from '../app/features/chat/components/chat-channel/chat-channel.component';
import { DirectmessagesComponent } from '../app/features/chat/components/chat-direct/chat-direct.component';
import { NewmessageComponent } from '../app/features/chat/components/chat-new-message/chat-new.component';
import { ImprintComponent } from '../app/features/legal/imprint/imprint.component';
import { DataprotectionComponent } from '../app/features/legal/data-protection/data-protection.component';

async function resolveLoadComponent(route: Route): Promise<unknown> {
  expect(route.loadComponent).toBeDefined();
  return route.loadComponent!();
}

function findChild(route: Route, path: string): Route {
  const child = route.children?.find((c) => c.path === path);
  expect(child).withContext(`expected a child route with path "${path}"`).toBeDefined();
  return child!;
}

describe('app.routes', () => {
  it('has exactly 4 top-level routes', () => {
    expect(routes.length).toBe(4);
  });

  describe('root "" route (auth layout)', () => {
    const rootRoute = routes[0];

    it('has path ""', () => {
      expect(rootRoute.path).toBe('');
    });

    it('is guarded by noAuthGuard', () => {
      expect(rootRoute.canActivate).toEqual([noAuthGuard]);
    });

    it('lazy-loads AuthLayoutComponent', async () => {
      const cmp = await resolveLoadComponent(rootRoute);
      expect(cmp).toBe(AuthLayoutComponent);
    });

    it('has 6 children', () => {
      expect(rootRoute.children?.length).toBe(6);
    });

    it('redirects the empty child path to "login"', () => {
      const child = findChild(rootRoute, '');
      expect(child.redirectTo).toBe('login');
      expect(child.pathMatch).toBe('full');
    });

    it('lazy-loads SignInComponent for "login"', async () => {
      const child = findChild(rootRoute, 'login');
      const cmp = await resolveLoadComponent(child);
      expect(cmp).toBe(SignInComponent);
    });

    it('lazy-loads SignUpComponent for "register"', async () => {
      const child = findChild(rootRoute, 'register');
      const cmp = await resolveLoadComponent(child);
      expect(cmp).toBe(SignUpComponent);
    });

    it('lazy-loads AvatarSelectionComponent for "register/avatar"', async () => {
      const child = findChild(rootRoute, 'register/avatar');
      const cmp = await resolveLoadComponent(child);
      expect(cmp).toBe(AvatarSelectionComponent);
    });

    it('lazy-loads ForgotPasswordComponent for "forgot-password"', async () => {
      const child = findChild(rootRoute, 'forgot-password');
      const cmp = await resolveLoadComponent(child);
      expect(cmp).toBe(ForgotPasswordComponent);
    });

    it('lazy-loads ResetPasswordComponent for "reset-password"', async () => {
      const child = findChild(rootRoute, 'reset-password');
      const cmp = await resolveLoadComponent(child);
      expect(cmp).toBe(ResetPasswordComponent);
    });
  });

  describe('"main" route', () => {
    const mainRoute = routes[1];

    it('has path "main"', () => {
      expect(mainRoute.path).toBe('main');
    });

    it('is guarded by authGuard', () => {
      expect(mainRoute.canActivate).toEqual([authGuard]);
    });

    it('lazy-loads MainChatComponent', async () => {
      const cmp = await resolveLoadComponent(mainRoute);
      expect(cmp).toBe(MainChatComponent);
    });

    it('has 4 children', () => {
      expect(mainRoute.children?.length).toBe(4);
    });

    it('the empty child is guarded by mainDefaultGuard, has no children of its own, and no component to load', () => {
      const child = findChild(mainRoute, '');
      expect(child.canActivate).toEqual([mainDefaultGuard]);
      expect(child.pathMatch).toBe('full');
      expect(child.children).toEqual([]);
      expect(child.loadComponent).toBeUndefined();
    });

    it('lazy-loads ChatContentComponent for "channel/:id"', async () => {
      const child = findChild(mainRoute, 'channel/:id');
      const cmp = await resolveLoadComponent(child);
      expect(cmp).toBe(ChatContentComponent);
    });

    it('lazy-loads DirectmessagesComponent for "direct/:id"', async () => {
      const child = findChild(mainRoute, 'direct/:id');
      const cmp = await resolveLoadComponent(child);
      expect(cmp).toBe(DirectmessagesComponent);
    });

    it('lazy-loads NewmessageComponent for "new-message"', async () => {
      const child = findChild(mainRoute, 'new-message');
      const cmp = await resolveLoadComponent(child);
      expect(cmp).toBe(NewmessageComponent);
    });
  });

  it('"imprint" route has no guard and lazy-loads ImprintComponent', async () => {
    const route = routes.find((r) => r.path === 'imprint')!;
    expect(route).toBeDefined();
    expect(route.canActivate).toBeUndefined();
    const cmp = await resolveLoadComponent(route);
    expect(cmp).toBe(ImprintComponent);
  });

  it('"Dataprotection" route has no guard and lazy-loads DataprotectionComponent', async () => {
    const route = routes.find((r) => r.path === 'Dataprotection')!;
    expect(route).toBeDefined();
    expect(route.canActivate).toBeUndefined();
    const cmp = await resolveLoadComponent(route);
    expect(cmp).toBe(DataprotectionComponent);
  });
});
