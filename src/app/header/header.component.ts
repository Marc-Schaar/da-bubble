import {
  Component,
  inject,
  Input,
  OnInit,
  Output,
  ViewChild,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { UserService } from '../shared.service';
import { getAuth, onAuthStateChanged, signOut, User } from '@firebase/auth';
import { Auth } from '@angular/fire/auth';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { FireServiceService } from '../fire-service.service';

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
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @ViewChild(MatMenuTrigger) menuTriggerRef!: MatMenuTrigger;
  showmodifycontent = false;
  displayName: string | null = null;
  user: User | null = null;
  auth = inject(Auth);
  opened = 0;
  chatmoduleenabled = inject(UserService);
  fireService = inject(FireServiceService);

  show() {
    this.opened++;
    this.showmodifycontent = true;
  }

  showmenu() {
    this.showmodifycontent = false;
  }

  async signOut() {
    const currentUser = this.chatmoduleenabled.getUser();
    currentUser.online = false;
    await this.fireService.updateOnlineStatus(currentUser);
    await signOut(this.auth);

    this.chatmoduleenabled.redirectiontologinpage();
  }
}
