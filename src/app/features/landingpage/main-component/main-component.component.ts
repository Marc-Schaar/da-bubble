import { Component, inject, OnInit } from '@angular/core';

import { IntroComponent } from '../intro/intro.component';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

import { SignInComponent } from '../sign-in/sign-in.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FooterComponent } from '../../../shared/components/footer/footer.component';
import { UserService } from '../../../shared/services/user/shared.service';

@Component({
  selector: 'app-main-component',
  imports: [CommonModule, HeaderComponent, FooterComponent, SignInComponent, IntroComponent, RouterModule],
  templateUrl: './main-component.component.html',
  styleUrl: './main-component.component.scss',
})
export class MainComponentComponent implements OnInit {
  shareddata = inject(UserService);
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
    this.shareddata.dashboard = false;
    this.shareddata.login = true;
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
