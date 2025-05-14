import { AfterViewInit, Component, inject, OnInit, ViewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { UserService } from '../services/user/shared.service';
import { Auth } from '@angular/fire/auth';
import { UserProfileComponent } from './user-profile/user-profile.component';
import { FireServiceService } from '../services/firebase/fire-service.service';
import { FormsModule } from '@angular/forms';
import { NavigationService } from '../services/navigation/navigation.service';
import { AuthService } from '../services/auth/auth.service';
import { SearchService } from '../services/search/search.service';
import { SearchResultComponent } from '../shared/search-result/search-result.component';

@Component({
  selector: 'app-header',
  imports: [MatMenuModule, MatIconModule, MatButtonModule, CommonModule, UserProfileComponent, FormsModule, SearchResultComponent],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @ViewChild(MatMenuTrigger) menuTriggerRef!: MatMenuTrigger;
  public auth = inject(Auth);
  private authService: AuthService = inject(AuthService);
  public userService = inject(UserService);
  public navigationService: NavigationService = inject(NavigationService);
  public searchService: SearchService = inject(SearchService);

  showBackground: boolean = false;
  showmodifycontent: boolean = false;
  isProfileCard: boolean = false;

  public input: string = '';
  channels: any[] = [];
  users: any[] = [];
  currentUser: any = null;

  /**
   * Increments the `opened` counter and sets `showmodifycontent` to true to display the modification content.
   */
  show() {
    this.showmodifycontent = true;
  }

  /**
   * Handles the menu closure and sets the background visibility to false.
   */
  onMenuClosed() {
    this.showBackground = false;
  }

  /**
   * Displays the menu and sets the background visibility to true.
   */
  showmenu() {
    this.showmodifycontent = false;
    this.showBackground = true;
  }

  /**
   * Signs out the current user, updates the online status, and redirects to the login page.
   */
  signOut() {
    this.authService.logOut();
  }
}
