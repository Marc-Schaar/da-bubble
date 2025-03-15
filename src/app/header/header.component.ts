import { CommonModule } from '@angular/common';
import { Component, inject, ViewChild } from '@angular/core';
import { RouterLink } from '@angular/router';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { User } from '../models/user';
import { Auth } from '@angular/fire/auth';
import { FireServiceService } from '../fire-service.service';
import { ChatServiceService } from '../chat-service.service';

@Component({
  selector: 'app-header',
  imports: [
    RouterLink,
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    UserProfileComponent,
  ],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
})
export class HeaderComponent {
  @ViewChild(MatMenuTrigger) menuTriggerRef!: MatMenuTrigger;
  showmodifycontent = false;
  displayName: string | null = null;
  user: User | null = null;
  auth = inject(Auth);
  opened = 0;
  chatmoduleenabled = inject(ChatServiceService);
  shareddata = inject(ChatServiceService);
  fireService = inject(FireServiceService);

  show() {
    this.opened++;
    this.showmodifycontent = true;
  }

  showmenu() {
    this.showmodifycontent = false;
  }

  // async signOut() {
  //   const currentUser = this.shareddata.getUser();
  //   currentUser.online = false;
  //   await this.fireService.updateOnlineStatus(currentUser);
  //   await signOut(this.auth);

  //   this.chatmoduleenabled.redirectiontologinpage();
  // }
}
