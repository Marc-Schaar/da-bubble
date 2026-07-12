import { Component } from '@angular/core';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { CONTACT_EMAIL } from '../../../shared/constants';

@Component({
  selector: 'app-dataprotection',
  imports: [HeaderComponent],
  templateUrl: './data-protection.component.html',
  styleUrl: './data-protection.component.scss',
})
export class DataprotectionComponent {
  protected readonly contactEmail = CONTACT_EMAIL;
}
