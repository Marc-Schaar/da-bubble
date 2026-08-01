import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'secondary' | 'icon' | 'plain';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-button--primary]': "variant() === 'primary'",
    '[class.app-button--secondary]': "variant() === 'secondary'",
    '[class.app-button--icon]': "variant() === 'icon'",
    '[class.app-button--plain]': "variant() === 'plain'",
    '[class.app-button--aria-disabled]': 'ariaDisabled()',
  },
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  type = input<'button' | 'submit'>('button');
  disabled = input(false, { transform: booleanAttribute });
  loading = input(false, { transform: booleanAttribute });
  ariaLabel = input<string | null>(null);
  ariaPressed = input<boolean | null>(null);
  ariaExpanded = input<boolean | null>(null);
  ariaHaspopup = input<string | null>(null);
  /** Keeps the button focusable/announced (unlike native `disabled`) while still blocking activation — for controls that must remain reachable to explain why they're unavailable, e.g. via a tooltip. */
  ariaDisabled = input(false, { transform: booleanAttribute });
  form = input<string | null>(null);

  onClick(event: MouseEvent): void {
    if (this.ariaDisabled()) {
      event.stopPropagation();
    }
  }
}
