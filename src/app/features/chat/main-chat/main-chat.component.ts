import { ChangeDetectionStrategy, Component, inject, ViewChild, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { HeaderSearchComponent } from '../../../shared/components/header-search/header-search.component';
import { HeaderUserMenuComponent } from '../../../shared/components/header-user-menu/header-user-menu.component';
import { NavigationService } from '../../../shared/services/navigation/navigation.service';
import { SearchService } from '../../../shared/services/search/search.service';
import { RouterModule } from '@angular/router';
import { ThreadComponent } from '../components/chat-thread/chat-thread.component';
import { ContactbarComponent } from '../components/contactbar/contactbar.component';

@Component({
  selector: 'app-main-chat',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    CommonModule,
    FormsModule,
    MatSidenavModule,
    ThreadComponent,
    RouterModule,
    HeaderComponent,
    HeaderSearchComponent,
    HeaderUserMenuComponent,
    ContactbarComponent,
  ],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MainChatComponent {
  @ViewChild('drawer') drawer!: MatDrawer;
  @ViewChild('drawerContactbar') drawerContactbar!: MatDrawer;
  public readonly navigationService: NavigationService = inject(NavigationService);
  private searchService: SearchService = inject(SearchService);

  public barOpen = signal<boolean>(true);
  public isChatOverlayVisible: boolean = false;

  /**
   * Toggles the visibility of the contact bar. `barOpen` itself is kept in
   * sync via the drawer's `(openedChange)` event, since `toggle()` animates
   * asynchronously and reading `.opened` right after it fires would lag.
   */
  public toogleContactbar() {
    this.drawerContactbar?.toggle();
  }

  public closeAll() {
    this.searchService.resetList();
  }
}
