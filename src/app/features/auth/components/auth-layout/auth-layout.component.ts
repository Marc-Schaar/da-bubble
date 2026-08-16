import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../../../shared/components/header/header.component';
import { FooterComponent } from '../../../../shared/components/footer/footer.component';
import { IntroComponent } from '../intro/intro.component';
import { SignUpBoxComponent } from '../sign-up-box/sign-up-box.component';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';

@Component({
  selector: 'app-auth-layout',
  imports: [CommonModule, HeaderComponent, FooterComponent, SignUpBoxComponent, IntroComponent, RouterModule],
  templateUrl: './auth-layout.component.html',
  styleUrl: './auth-layout.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AuthLayoutComponent implements OnInit {
  public navigationService: NavigationService = inject(NavigationService);
  public showIntro = signal<boolean>(true);

  /**
   * Shows the intro unless it's the password page or it was already seen this session,
   * then hides it again after 4 seconds.
   */
  ngOnInit(): void {
    const hasSeenIntro = sessionStorage.getItem('showIntro') === 'false';
    if (this.navigationService.isPasswordPage() || hasSeenIntro) {
      this.showIntro.set(false);
      return;
    }

    setTimeout(() => {
      this.showIntro.set(false);
      this.markIntroAsSeen();
    }, 4000);
  }

  /**
   * Marks the intro as seen in session storage, so it won't show again this session.
   */
  private markIntroAsSeen() {
    sessionStorage.setItem('showIntro', 'false');
  }
}
