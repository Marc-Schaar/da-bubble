import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { CONTACT_EMAIL } from '../../../shared/constants';
import { ButtonDirective } from '../../../shared/components/button/button.directive';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-dataprotection',
  imports: [HeaderComponent, ButtonDirective, MatIconModule],
  templateUrl: './data-protection.component.html',
  styleUrl: './data-protection.component.scss',
})
export class DataprotectionComponent {
  private location = inject(Location);
  protected readonly contactEmail = CONTACT_EMAIL;

  /** Returns to whichever page linked here (login, register, main chat, …). */
  public goBack() {
    this.location.back();
  }
}
