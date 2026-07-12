import { ChangeDetectionStrategy, Component, model } from '@angular/core';
import { AVATAR_IMAGES } from '../../constants';

/**
 * Shared avatar grid used by the registration step and the
 * profile dialog; exposes the selection as a two-way model.
 */
@Component({
  selector: 'app-avatar-picker',
  templateUrl: './avatar-picker.component.html',
  styleUrl: './avatar-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AvatarPickerComponent {
  public readonly avatars = AVATAR_IMAGES;
  public selected = model<string>('');
}
