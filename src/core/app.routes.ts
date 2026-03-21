import { Routes } from '@angular/router';
import { ImprintComponent } from '../app/features/legal/imprint/imprint.component';
import { DataprotectionComponent } from '../app/features/legal/data-protection/data-protection.component';
import { MainComponentComponent } from '../app/features/app_auth/components/main-component/main-component.component';
import { ForgotpasswordComponent } from '../app/features/app_auth/components/forgot-password/forgot-password.component';
import { ResetpasswordComponent } from '../app/features/app_auth/components/reset-password/reset-password.component';
import { AvatarselectionComponent } from '../app/features/app_auth/components/avatar-selection/avatar-selection.component';
import { ContactbarComponent } from '../app/features/app_chat/contactbar/contactbar.component';
import { MainChatComponent } from '../app/features/app_chat/main-chat/main-chat.component';
import { ChatContentComponent } from '../app/features/app_chat/chat-channel/chat-channel.component';
import { DirectmessagesComponent } from '../app/features/app_chat/chat-direct/chat-direct.component';
import { NewmessageComponent } from '../app/features/app_chat/chat-new-message/chat-new.component';
import { ThreadComponent } from '../app/features/app_chat/chat-thread/chat-thread.component';
import { LoginComponent } from '../app/features/app_auth/components/login/login.component';
import { RegisterComponent } from '../app/features/app_auth/components/register/register.component';

export const routes: Routes = [
  { path: '', 
    component: MainComponentComponent, 
     children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
    ], 
},
 
  { path: 'forgotpassword', component: ForgotpasswordComponent},
  { path: 'resetpassword', component: ResetpasswordComponent },
  { path: 'avatarselection', component: AvatarselectionComponent },
  { path: 'contactbar', component: ContactbarComponent},
  { path: 'chat', component: MainChatComponent },
  { path: 'channel', component: ChatContentComponent },
  { path: 'direct', component: DirectmessagesComponent },
  { path: 'new-message', component: NewmessageComponent},
  { path: 'thread', component: ThreadComponent },
  { path: 'imprint', component: ImprintComponent },
  { path: 'Dataprotection', component: DataprotectionComponent},
];
