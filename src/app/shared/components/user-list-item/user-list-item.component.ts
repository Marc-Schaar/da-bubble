import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

import { ProfileStatusComponent } from '../profile-status/profile-status.component';
import { UnreadBadgeComponent } from '../unread-badge/unread-badge.component';
import { User } from '../../../features/auth/models/user/user';

/**
 * Dumb list-item fragment: avatar + online-dot + display name, with an
 * optional "(Du)" marker for the current user. Reused wherever member/user
 * lists render an entry (add-member, edit-channel, contactbar, search-result).
 * Renders with `display: contents` so it drops into the caller's own
 * `<li>`/flex layout without an extra wrapping element.
 */
@Component({
  selector: 'app-user-list-item',
  imports: [ProfileStatusComponent, UnreadBadgeComponent],
  templateUrl: './user-list-item.component.html',
  styleUrl: './user-list-item.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserListItemComponent {
  public user = input.required<User>();
  public currentUserId = input<string | null>(null);
  public unreadCount = input<number>(0);

  protected readonly isCurrentUser = computed(() => !!this.currentUserId() && this.user().id === this.currentUserId());
}
