import { ChangeDetectionStrategy, Component } from '@angular/core';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { LegalHeaderComponent } from '../../../shared/components/legal-header/legal-header.component';
import { CONTACT_EMAIL } from '../../../shared/constants';

@Component({
  selector: 'app-imprint',
  imports: [HeaderComponent, LegalHeaderComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ImprintComponent {
  protected readonly contactEmail = CONTACT_EMAIL;
}
