import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { ButtonDirective } from '../../../../../shared/components/button/button.directive';

/**
 * Renders the grid of preselected quick-reaction emoji buttons shared by
 * the hover reaction bar (message-template) and the reaction footer
 * (message-reactions). Positioning of the surrounding `.reaction-menu`
 * popup stays with each parent, since it differs by context (hover bar
 * vs. footer, own vs. reversed message).
 */
@Component({
  selector: 'app-emoji-quick-picker',
  imports: [CommonModule, ButtonDirective],
  templateUrl: './emoji-quick-picker.component.html',
  styleUrl: './emoji-quick-picker.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EmojiQuickPickerComponent {
  public emojis = input.required<string[]>();
  public isSelected = input.required<(emoji: string) => boolean>();
  public pick = output<string>();
}
