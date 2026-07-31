import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIcon } from '@angular/material/icon';
import { AuthService } from '../../services/auth/auth.service';
import { AvatarPickerComponent } from '../../../../shared/components/avatar-picker/avatar-picker.component';
import { DEFAULT_AVATAR } from '../../../../shared/constants';
import { ButtonComponent } from '../../../../shared/components/button/button.component';

@Component({
  selector: 'app-avatar-selection',
  imports: [CommonModule, RouterModule, AvatarPickerComponent, ButtonComponent, MatIcon],
  templateUrl: './avatar-selection.component.html',
  styleUrls: ['./avatar-selection.component.scss'],
})
export class AvatarSelectionComponent {
  public currentAvatar = signal<string>(DEFAULT_AVATAR);

  public readonly authService: AuthService = inject(AuthService);

  public onSubmit() {
    this.authService.completeRegistration(this.currentAvatar());
  }
}
