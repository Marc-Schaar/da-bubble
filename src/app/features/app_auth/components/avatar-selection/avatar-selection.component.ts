import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

@Component({
  selector: 'app-avatarselection',
  imports: [CommonModule, RouterModule],
  templateUrl: './avatar-selection.component.html',
  styleUrls: ['./avatar-selection.component.scss'],
})
export class AvatarselectionComponent {
  public currentAvatar = signal<string>('img/avatars/avatar_default.png');

  public readonly authService: AuthService = inject(AuthService);

  public avatars = ['avatar_1.png', 'avatar_2.png', 'avatar_3.png', 'avatar_4.png', 'avatar_5.png', 'avatar_6.png'];

  public selectAvatar(avatar: string) {
    const fullPath = `img/avatars/${avatar}`;
    this.currentAvatar.set(fullPath);
  }

  public onSubmit() {
    this.authService.completeRegistration(this.currentAvatar());
  }
}
