import { Component, inject, input } from '@angular/core';
import { Location } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { ButtonComponent } from '../button/button.component';

@Component({
  selector: 'app-legal-header',
  imports: [MatIconModule, ButtonComponent],
  templateUrl: './legal-header.component.html',
  styleUrl: './legal-header.component.scss',
})
export class LegalHeaderComponent {
  public readonly heading = input.required<string>();
  private readonly location = inject(Location);

  /** Returns to whichever page linked here (login, register, main chat, …). */
  public goBack() {
    this.location.back();
  }
}
