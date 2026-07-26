import { booleanAttribute, ChangeDetectionStrategy, Component, input } from '@angular/core';

export type ButtonVariant = 'primary' | 'outline' | 'icon' | 'plain';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '[class.app-button--primary]': "variant() === 'primary'",
    '[class.app-button--outline]': "variant() === 'outline'",
    '[class.app-button--icon]': "variant() === 'icon'",
    '[class.app-button--plain]': "variant() === 'plain'",
  },
})
export class ButtonComponent {
  variant = input<ButtonVariant>('primary');
  type = input<'button' | 'submit'>('button');
  disabled = input(false, { transform: booleanAttribute });
  ariaLabel = input<string | null>(null);
  ariaPressed = input<boolean | null>(null);
  form = input<string | null>(null);
}
