import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { MatIcon } from '@angular/material/icon';
import { ButtonComponent } from '../button/button.component';

/**
 * Dumb dialog/profile-card header: a title and a close button.
 */
@Component({
  selector: 'app-dialog-header',
  imports: [ButtonComponent, MatIcon],
  templateUrl: './dialog-header.component.html',
  styleUrl: './dialog-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogHeaderComponent {
  title = input.required<string>();
  closed = output<void>();
}
