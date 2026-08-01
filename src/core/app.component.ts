import { Component, OnInit, Inject, PLATFORM_ID } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { isPlatformBrowser } from '@angular/common';
import * as AOS from 'aos';
import { ToastContainerComponent } from '../app/shared/components/toast-container/toast-container.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, ToastContainerComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent implements OnInit {
  title = 'DaBubble';

  /**
   * Constructor for the component that injects the platform ID.
   *
   * @param platformId - The platform identifier injected from Angular, used to check if the app is running in the browser.
   */
  constructor(@Inject(PLATFORM_ID) private platformId: Object) {}

  /**
   * ngOnInit lifecycle hook that initializes the AOS (Animate On Scroll) library
   * only if the application is running in the browser platform.
   */
  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init({
        disable: () => window.matchMedia('(prefers-reduced-motion: reduce)').matches,
      });
    }
  }
}
