import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LegalHeaderComponent } from '../../../shared/components/legal-header/legal-header.component';
import { CONTACT_EMAIL } from '../../../shared/constants';

@Component({
  selector: 'app-dataprotection',
  imports: [HeaderComponent, LegalHeaderComponent],
  templateUrl: './data-protection.component.html',
  styleUrl: './data-protection.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DataprotectionComponent {
  protected readonly contactEmail = CONTACT_EMAIL;
}
