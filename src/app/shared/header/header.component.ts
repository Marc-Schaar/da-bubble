import { Component, inject, ViewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { RouterModule } from '@angular/router';
import { SearchResultComponent } from '../search-result/search-result.component';
import { AuthService } from '../../services/auth/auth.service';
import { UserService } from '../../services/user/shared.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { SearchService } from '../../services/search/search.service';
import { UserProfileComponent } from '../../dialogs/user-profile/user-profile.component';
import { UserMenuComponent } from '../../dialogs/user-menu/user-menu.component';

@Component({
  selector: 'app-header',
  imports: [MatMenuModule, MatIconModule, MatButtonModule, CommonModule, FormsModule, SearchResultComponent, RouterModule],
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
  private matDialog: MatDialog = inject(MatDialog);
  private bottomSheet = inject(MatBottomSheet);
  showBackground: boolean = false;
  isProfileCard: boolean = false;
  public input: string = '';

  /**
   * Opens the User Profile Dialog.
   */
  public openUserProfile() {
    this.matDialog.open(UserProfileComponent, {
      panelClass: 'user-profile-dialog-bottom-left',
      hasBackdrop: false,
    });
  }

  /**
   * Handles the menu closure and sets the background visibility to false.
   */
  public onMenuClosed() {
    this.matDialog.closeAll();
    this.showBackground = false;
  }

  /**
   * Displays the menu and sets the background visibility to true.
   */
  public showmenu() {
    this.showBackground = true;
  }

  /**
   * Displays the mobile menu as Bottomsheet.
   */
  public showMenuMobile() {
    this.bottomSheet.open(UserMenuComponent);
  }

  /**
   * Signs out the current user, updates the online status, and redirects to the login page.
   */
  public signOut() {
    this.authService.logOut();
  }
}
