import { ChangeDetectionStrategy, Component, inject, input } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth/auth.service';

/**
 * Wraps a guest-locked trigger (projected content) with the
 * "Zugang für Gäste gesperrt" hover tooltip. Was duplicated markup/CSS
 * across chat-channel, contactbar and user-profile before.
 * Position is theme-able per usage via --tooltip-* custom properties
 * set on the host element (pierces view encapsulation).
 */
@Component({
  selector: 'app-guest-lock-tooltip',
  templateUrl: './guest-lock-tooltip.component.html',
  styleUrl: './guest-lock-tooltip.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class GuestLockTooltipComponent {
  protected readonly authService = inject(AuthService);

  mobilePosition = input(false);
}
