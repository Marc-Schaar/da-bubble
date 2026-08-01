import { Routes } from '@angular/router';
import { authGuard } from './auth.guard';
import { noAuthGuard } from './no-auth.guard';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('../app/features/auth/components/auth-layout/auth-layout.component').then(
        (m) => m.AuthLayoutComponent,
      ),
    canActivate: [noAuthGuard],
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () =>
          import('../app/features/auth/components/sign-in/sign-in.component').then(
            (m) => m.SignInComponent,
          ),
      },
      {
        path: 'register',
        loadComponent: () =>
          import('../app/features/auth/components/sign-up/sign-up.component').then(
            (m) => m.SignUpComponent,
          ),
      },
      {
        path: 'register/avatar',
        loadComponent: () =>
          import('../app/features/auth/components/avatar-selection/avatar-selection.component').then(
            (m) => m.AvatarSelectionComponent,
          ),
      },
      {
        path: 'forgot-password',
        loadComponent: () =>
          import('../app/features/auth/components/forgot-password/forgot-password.component').then(
            (m) => m.ForgotPasswordComponent,
          ),
      },
      {
        path: 'reset-password',
        loadComponent: () =>
          import('../app/features/auth/components/reset-password/reset-password.component').then(
            (m) => m.ResetPasswordComponent,
          ),
      },
    ],
  },

  {
    path: 'main',
    loadComponent: () =>
      import('../app/features/chat/main-chat/main-chat.component').then(
        (m) => m.MainChatComponent,
      ),
    children: [
      { path: '', redirectTo: 'new-message', pathMatch: 'full' },
      {
        path: 'channel/:id',
        loadComponent: () =>
          import('../app/features/chat/components/chat-channel/chat-channel.component').then(
            (m) => m.ChatContentComponent,
          ),
      },
      {
        path: 'direct/:id',
        loadComponent: () =>
          import('../app/features/chat/components/chat-direct/chat-direct.component').then(
            (m) => m.DirectmessagesComponent,
          ),
      },
      {
        path: 'new-message',
        loadComponent: () =>
          import('../app/features/chat/components/chat-new-message/chat-new.component').then(
            (m) => m.NewmessageComponent,
          ),
      },
    ],
    canActivate: [authGuard],
  },

  {
    path: 'imprint',
    loadComponent: () =>
      import('../app/features/legal/imprint/imprint.component').then((m) => m.ImprintComponent),
  },
  {
    path: 'Dataprotection',
    loadComponent: () =>
      import('../app/features/legal/data-protection/data-protection.component').then(
        (m) => m.DataprotectionComponent,
      ),
  },
];
