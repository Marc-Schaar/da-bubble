import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-card-header',
  standalone: true,
  templateUrl: './card-header.component.html',
  styleUrl: './card-header.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CardHeaderComponent {}
