import { Component, inject, OnInit, signal, ViewChild } from '@angular/core';
import { MatMenuModule, MatMenuTrigger } from '@angular/material/menu';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { CommonModule } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { FormsModule } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { MatBottomSheet } from '@angular/material/bottom-sheet';
import { NavigationEnd, Router, RouterModule } from '@angular/router';
import { SearchResultComponent } from '../search-result/search-result.component';

import { UserService } from '../../services/user/shared.service';
import { NavigationService } from '../../services/navigation/navigation.service';
import { SearchService } from '../../services/search/search.service';
import { UserProfileComponent } from '../../../features/dialogs/user-profile/user-profile.component';
import { UserMenuComponent } from '../../../features/dialogs/user-menu/user-menu.component';
import { AuthService } from '../../../features/app_auth/services/auth/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-header',
  imports: [MatMenuModule, MatIconModule, MatButtonModule, CommonModule, FormsModule, SearchResultComponent, RouterModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.scss'],
})
export class HeaderComponent implements OnInit {
  @ViewChild(MatMenuTrigger) menuTriggerRef!: MatMenuTrigger;
  public authService: AuthService = inject(AuthService);
  public navigationService: NavigationService = inject(NavigationService);
  public searchService: SearchService = inject(SearchService);
  private matDialog: MatDialog = inject(MatDialog);
  private bottomSheet = inject(MatBottomSheet);
  showBackground: boolean = false;
  isProfileCard: boolean = false;
  public input: string = '';

  private router = inject(Router);
  public isAuthPage = signal<boolean>(true);
  public isContactbarPage = signal<boolean>(true);

  ngOnInit() {
    this.checkCurrentUrl(this.router.url);

    this.router.events.pipe(filter((event) => event instanceof NavigationEnd)).subscribe((event: NavigationEnd) => {
      this.checkCurrentUrl(event.urlAfterRedirects);
    });
  }

  /**
   * Zentrale Methode, um die URL zu prüfen und das Signal zu setzen
   */
  private checkCurrentUrl(url: string) {
    const isAuth = url.includes('login') || url.includes('register');
    const isContactbar = url.includes('contactbar');
    this.isAuthPage.set(isAuth);
    this.isContactbarPage.set(isContactbar);
    console.log('Ist Auth-Seite:', isAuth);
    console.log('Ist Contactabar-Seite:', isContactbar);
  }

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
