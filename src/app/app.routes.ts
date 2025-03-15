import { Routes } from '@angular/router';
import { IntroComponent } from './intro/intro.component';
import { MainComponentComponent } from './main-component/main-component.component';
import { SignInComponent } from './sign-in/sign-in.component';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { SignUpComponent } from './sign-up/sign-up.component';
import { ForgotPasswordComponent } from './forgot-password/forgot-password.component';
import { ResetPasswordComponent } from './reset-password/reset-password.component';
import { AvatarSelectionComponent } from './avatar-selection/avatar-selection.component';
import { ContactbarComponent } from './contactbar/contactbar.component';
import { AddChannelComponent } from './add-channel/add-channel.component';
import { ThreadComponent } from './thread/thread.component';
import { DirectMessagesComponent } from './direct-messages/direct-messages.component';
import { ImprintComponent } from './imprint/imprint.component';
import { DataProtectionComponent } from './data-protection/data-protection.component';
import { MainChatComponent } from './main-chat/main-chat.component';

export const routes: Routes = [
  { path: '', component: IntroComponent },
  { path: 'main', component: MainComponentComponent },
  { path: 'signin', component: SignInComponent },
  { path: 'signup', component: SignUpComponent },
  { path: 'forgotpassword', component: ForgotPasswordComponent },
  { path: 'resetpassword', component: ResetPasswordComponent },
  { path: 'user-profile', component: UserProfileComponent },
  { path: 'avatarselection', component: AvatarSelectionComponent },
  { path: 'add-channel', component: AddChannelComponent },
  { path: 'contactbar', component: ContactbarComponent },
  { path: 'chat', component: MainChatComponent },
  { path: 'direct', component: DirectMessagesComponent },
  { path: 'thread', component: ThreadComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'Dataprotection', component: DataProtectionComponent },
];
