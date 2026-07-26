import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from '../button/button.directive';

/**
 * Dumb dialog/profile-card header: a title and a close button.
 * Reused by the small profile dialogs (dialog-receiver, user-profile) that
 * otherwise duplicated the exact same header markup and styling.
 */
@Component({
  selector: 'app-dialog-header',
  imports: [ButtonDirective],
  templateUrl: './dialog-header.component.html',
  styleUrl: './dialog-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogHeaderComponent {
  title = input.required<string>();
  closed = output<void>();
}
