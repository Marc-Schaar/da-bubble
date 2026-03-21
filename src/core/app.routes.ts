import { Routes } from '@angular/router';


import { MainComponentComponent } from '../app/features/landingpage/main-component/main-component.component';
import { SignInComponent } from '../app/features/landingpage/sign-in/sign-in.component';
import { SignupComponent } from '../app/features/landingpage/sign-up/sign-up.component';
import { ForgotpasswordComponent } from '../app/features/landingpage/forgot-password/forgot-password.component';
import { ResetpasswordComponent } from '../app/features/reset-password/reset-password.component';
import { AvatarselectionComponent } from '../app/features/landingpage/avatar-selection/avatar-selection.component';
import { ContactbarComponent } from '../app/features/chat-page/contactbar/contactbar.component';
import { MainChatComponent } from '../app/features/chat-page/main-chat/main-chat.component';
import { ChatContentComponent } from '../app/features/chat-page/chat-channel/chat-channel.component';
import { DirectmessagesComponent } from '../app/features/chat-page/chat-direct/chat-direct.component';
import { NewmessageComponent } from '../app/features/chat-page/chat-new-message/chat-new.component';
import { ThreadComponent } from '../app/features/chat-page/chat-thread/chat-thread.component';
import { ImprintComponent } from '../app/features/imprint/imprint.component';
import { DataprotectionComponent } from '../app/features/data-protection/data-protection.component';

export const routes: Routes = [
  { path: '', component: MainComponentComponent },
  { path: 'signin', component: SignInComponent },
  { path: 'signup', component: SignupComponent },
  { path: 'forgotpassword', component: ForgotpasswordComponent },
  { path: 'resetpassword', component: ResetpasswordComponent },
  { path: 'avatarselection', component: AvatarselectionComponent },
  { path: 'contactbar', component: ContactbarComponent},
  { path: 'chat', component: MainChatComponent },
  { path: 'channel', component: ChatContentComponent },
  { path: 'direct', component: DirectmessagesComponent },
  { path: 'new-message', component: NewmessageComponent },
  { path: 'thread', component: ThreadComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'Dataprotection', component: DataprotectionComponent},
];
