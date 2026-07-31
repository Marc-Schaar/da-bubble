import { Routes } from '@angular/router';
import { ImprintComponent } from '../app/features/legal/imprint/imprint.component';
import { DataprotectionComponent } from '../app/features/legal/data-protection/data-protection.component';
import { AuthLayoutComponent } from '../app/features/auth/components/auth-layout/auth-layout.component';
import { ForgotPasswordComponent } from '../app/features/auth/components/forgot-password/forgot-password.component';
import { ResetPasswordComponent } from '../app/features/auth/components/reset-password/reset-password.component';
import { MainChatComponent } from '../app/features/chat/main-chat/main-chat.component';
import { ChatContentComponent } from '../app/features/chat/components/chat-channel/chat-channel.component';
import { DirectmessagesComponent } from '../app/features/chat/components/chat-direct/chat-direct.component';
import { NewmessageComponent } from '../app/features/chat/components/chat-new-message/chat-new.component';

import { SignInComponent } from '../app/features/auth/components/sign-in/sign-in.component';
import { SignUpComponent } from '../app/features/auth/components/sign-up/sign-up.component';
import { AvatarSelectionComponent } from '../app/features/auth/components/avatar-selection/avatar-selection.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    component: AuthLayoutComponent,
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: SignInComponent },
      { path: 'register', component: SignUpComponent },
      { path: 'register/avatar', component: AvatarSelectionComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'resetpassword', component: ResetPasswordComponent },
    ],
  },

  {
    path: 'main',
    component: MainChatComponent,
    children: [
      { path: 'channel/:id', component: ChatContentComponent },
      { path: 'direct/:id', component: DirectmessagesComponent },
      { path: 'new-message', component: NewmessageComponent },
    ],
    canActivate: [authGuard],
  },

  { path: 'imprint', component: ImprintComponent },
  { path: 'Dataprotection', component: DataprotectionComponent },
];
