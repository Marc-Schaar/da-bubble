import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { Router, RouterModule } from '@angular/router';
import { SearchResultComponent } from '../search-result/search-result.component';

import { NavigationService } from '../../services/navigation/navigation.service';
import { SearchService } from '../../services/search/search.service';
import { UserProfileComponent } from '../user-profile/user-profile.component';
import { UserMenuComponent } from '../user-menu/user-menu.component';
import { AuthService } from '../../../features/auth/services/auth/auth.service';
import { InputComponent } from '../input/input.component';
import { ButtonComponent } from '../button/button.component';
import { ProfileStatusComponent } from '../profile-status/profile-status.component';
import { SignUpBoxComponent } from '../../../features/auth/components/sign-up-box/sign-up-box.component';

@Component({
  selector: 'app-header',
  imports: [
    MatMenuModule,
    MatIconModule,
    MatButtonModule,
    CommonModule,
    FormsModule,
    SearchResultComponent,
    RouterModule,
    InputComponent,
    ButtonComponent,
    ProfileStatusComponent,
    SignUpBoxComponent,
  ],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent {
  @ViewChild(MatMenuTrigger) menuTriggerRef!: MatMenuTrigger;
  public authService: AuthService = inject(AuthService);
  public navigationService: NavigationService = inject(NavigationService);
  public searchService: SearchService = inject(SearchService);
  private matDialog: MatDialog = inject(MatDialog);
  private bottomSheet = inject(MatBottomSheet);
  isProfileCard: boolean = false;
  public input: string = '';

  /**
   * Zentrale Methode, um die URL zu prüfen und das Signal zu setzen
   */

  /**
   * Opens the User Profile Dialog.
   */
  public showProfile() {
    this.matDialog.open(UserProfileComponent, {
      panelClass: 'user-profile-dialog-bottom-left',
    });
  }

  /**
   * Handles the menu closure and sets the background visibility to false.
   */
  public onMenuClosed() {
    this.matDialog.closeAll();
  }

  /**
   * Opens the mobile menu on mobile devices. On desktop, the click already
   * triggers the mat-menu via [matMenuTriggerFor] on the same element.
   */
  public onOpenMenu() {
    if (this.navigationService.isMobile()) {
      this.showMenuMobile();
    }
  }

  /**
   * Displays the mobile menu as Bottomsheet.
   */
  private showMenuMobile() {
    this.bottomSheet.open(UserMenuComponent);
  }

  /**
   * Signs out the current user, updates the online status, and redirects to the login page.
   */
  public signOut() {
    this.authService.logOut();
  }
}
