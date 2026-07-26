import { Component, inject } from '@angular/core';
import { Location } from '@angular/common';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { CONTACT_EMAIL } from '../../../shared/constants';
import { ButtonDirective } from '../../../shared/components/button/button.directive';

@Component({
  selector: 'app-imprint',
  imports: [HeaderComponent, ButtonDirective],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
})
export class ImprintComponent {
  private location = inject(Location);
  protected readonly contactEmail = CONTACT_EMAIL;

  /** Returns to whichever page linked here (login, register, main chat, …). */
  public goBack() {
    this.location.back();
  }
}
