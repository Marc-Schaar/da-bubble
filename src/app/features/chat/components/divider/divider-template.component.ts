import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { RelativeDatePipe } from '../../../../shared/pipes/relative-date.pipe';

@Component({
  selector: 'app-divider-template',
  imports: [RelativeDatePipe],
  templateUrl: './divider-template.component.html',
  styleUrl: './divider-template.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DividerTemplateComponent {
  messageData = input.required<Date | any>();
}
