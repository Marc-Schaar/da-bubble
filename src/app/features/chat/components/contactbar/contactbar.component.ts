import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, ViewChild } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { RouterModule } from '@angular/router';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { HeaderUserMenuComponent } from '../../../../shared/components/header-user-menu/header-user-menu.component';
import { SearchResultComponent } from '../../../../shared/components/search-result/search-result.component';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { SearchService } from '../../../../shared/services/search/search.service';
import { AddChannelComponent } from '../../../channel/components/add-channel/add-channel.component';
import { UserListItemComponent } from '../../../../shared/components/user-list-item/user-list-item.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { GuestLockTooltipComponent } from '../../../../shared/components/guest-lock-tooltip/guest-lock-tooltip.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { UnreadBadgeComponent } from '../../../../shared/components/unread-badge/unread-badge.component';
import { UnreadService } from '../../../../shared/services/unread/unread.service';
import { getConversationId } from '../../../../shared/utils/conversation-id.util';

@Component({
  selector: 'app-contactbar',
  standalone: true,
  imports: [
    CommonModule,
    HeaderComponent,
    HeaderUserMenuComponent,
    MatIconModule,
    FormsModule,
    SearchResultComponent,
    RouterModule,
    UserListItemComponent,
    ButtonComponent,
    InputComponent,
    GuestLockTooltipComponent,
    CardComponent,
    UnreadBadgeComponent,
  ],
  templateUrl: './contactbar.component.html',
  styleUrl: './contactbar.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ContactbarComponent implements OnInit {
  public firestoreService = inject(FireServiceService);
  public navigationService: NavigationService = inject(NavigationService);
  public searchService: SearchService = inject(SearchService);
  private dialog: MatDialog = inject(MatDialog);
  public router: Router = inject(Router);
  public authService = inject(AuthService);
  public unreadService = inject(UnreadService);

  isClicked = false;
  public input: string = '';

  @ViewChild(SearchResultComponent) private searchResultRef?: SearchResultComponent;

  protected readonly listboxId = 'contactbar-search-listbox';

  /** Arrow/Enter/Escape navigation for the mobile search dropdown; only active while it's actually open. */
  protected onSearchKeydown(event: KeyboardEvent): void {
    if (!this.searchService.getHeaderListBoolean()) return;
    this.searchService.handleDropdownKeydown(event, () => this.searchResultRef?.selectHighlighted());
  }

  protected activeDescendantId(): string | null {
    const index = this.searchService.getHighlightedIndex();
    return this.searchService.getHeaderListBoolean() && index >= 0 ? `${this.listboxId}-option-${index}` : null;
  }

  /**
   * Initializes the component by ensuring the shared user and channel
   * streams are running (owned by FireService, app-lifetime).
   */
  ngOnInit() {
    this.firestoreService.subAllUsers();
    this.firestoreService.subChannels();
  }

  /** Resolves a DM contact's unread-counter key (the deterministic conversationId, not their raw user id). */
  public dmUnreadCount(otherUserId: string): number {
    const currentUserId = this.authService.currentUser()?.id;
    if (!currentUserId) return 0;
    return this.unreadService.unreadCounts().get(getConversationId(currentUserId, otherUserId)) ?? 0;
  }

  public toggleDropdown(type: 'channels' | 'directMessages') {
    if (type === 'channels') {
      this.navigationService.isChannelsOpen.update((v) => !v);
    } else {
      this.navigationService.isDirectMessagesOpen.update((v) => !v);
    }
  }

  /**
   * Opens the dialog to add a new channel.
   */
  public openAddChannel() {
    if (this.authService.isGuest()) return;
    this.dialog.open(AddChannelComponent, {
      width: '872px',
      maxWidth: '95vw',
      height: 'auto',
      position: { top: '50%', left: '50%' },
      panelClass: 'fullscreen',
      autoFocus: 'first-tabbable',
      restoreFocus: true,
      ariaLabel: 'Channel erstellen',
    });
  }

}
