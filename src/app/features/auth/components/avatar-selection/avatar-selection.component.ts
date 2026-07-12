import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';
import { AvatarPickerComponent } from '../../../../shared/components/avatar-picker/avatar-picker.component';
import { DEFAULT_AVATAR } from '../../../../shared/constants';

@Component({
  selector: 'app-avatarselection',
  imports: [CommonModule, RouterModule, AvatarPickerComponent],
  templateUrl: './avatar-selection.component.html',
  styleUrls: ['./avatar-selection.component.scss'],
})
export class AvatarselectionComponent {
  public currentAvatar = signal<string>(DEFAULT_AVATAR);

  public readonly authService: AuthService = inject(AuthService);

  public onSubmit() {
    this.authService.completeRegistration(this.currentAvatar());
  }
}
