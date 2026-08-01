import { AfterViewInit, ChangeDetectionStrategy, Component, ElementRef, inject, input } from '@angular/core';
import { AuthService } from '../../../features/auth/services/auth/auth.service';

let uid = 0;

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
export class GuestLockTooltipComponent implements AfterViewInit {
  protected readonly authService = inject(AuthService);
  private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

  mobilePosition = input(false);

  protected readonly tooltipId = `guest-lock-tooltip-${uid++}`;

  /** Projected trigger(s) can't set aria-describedby themselves, so wire it up imperatively — covers the one call site that projects two buttons too. */
  ngAfterViewInit(): void {
    this.elementRef.nativeElement.querySelectorAll('button').forEach((button) => button.setAttribute('aria-describedby', this.tooltipId));
  }
}
