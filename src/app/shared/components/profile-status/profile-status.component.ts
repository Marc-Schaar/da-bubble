import { CommonModule } from '@angular/common';
import { Component, input } from '@angular/core';

@Component({
  selector: 'app-profile-status',
  imports: [CommonModule],
  templateUrl: './profile-status.component.html',
  styleUrl: './profile-status.component.scss',
})
export class ProfileStatusComponent {
  photoUrl = input.required<string>();
  online = input<boolean>(false);
}
