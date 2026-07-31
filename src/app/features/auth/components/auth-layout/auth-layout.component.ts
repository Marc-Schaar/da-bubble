import { Component, inject, OnInit } from '@angular/core';
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
})
export class AuthLayoutComponent implements OnInit {
  public navigationService: NavigationService = inject(NavigationService);
  showIntro: boolean = true;

  /**
   * Lifecycle hook that is called when the component is initialized.
   * checks if the intro should be shown based on local storage value.
   * Sets the dashboard and login properties of the shared service and hides the intro element after 4 seconds.
   */
  ngOnInit(): void {
    const showIntroStored = localStorage.getItem('showIntro');
    if (showIntroStored === 'false') {
      this.showIntro = false;
    } else {
      this.showIntro = true;
      setTimeout(() => {
        const projectName = document.getElementById('intro');
        if (projectName) {
          projectName.classList.add('d-none');
          this.turnOffIntro();
        }
      }, 4000);
    }
  }

  /**
   * Disables the introductory view by setting a flag in local storage.
   *
   * Sets 'showIntro' to 'false' in localStorage to prevent the intro from showing again.
   */
  turnOffIntro() {
    localStorage.setItem('showIntro', 'false');
  }
}
