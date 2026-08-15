import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/**
 * Small numeric pill for unread-message counts. Renders nothing at 0, caps
 * the display at "99+". `display: contents` on :host lets it drop straight
 * into the caller's flex row without an extra wrapping element.
 */
@Component({
  selector: 'app-unread-badge',
  standalone: true,
  templateUrl: './unread-badge.component.html',
  styleUrl: './unread-badge.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UnreadBadgeComponent {
  public count = input<number>(0);

  protected readonly display = computed(() => (this.count() > 99 ? '99+' : `${this.count()}`));
}
