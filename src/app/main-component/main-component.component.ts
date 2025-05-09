import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { FooterComponent } from '../footer/footer.component';
import { SignInComponent } from '../sign-in/sign-in.component';
import { UserService } from '../shared.service';
import { IntroComponent } from '../intro/intro.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-component',
  imports: [HeaderComponent, FooterComponent, SignInComponent, IntroComponent, RouterModule],
  templateUrl: './main-component.component.html',
  styleUrl: './main-component.component.scss',
})
export class MainComponentComponent implements OnInit {
  shareddata = inject(UserService);

  /**
   * Lifecycle hook that is called when the component is initialized.
   * Sets the dashboard and login properties of the shared service and hides the intro element after 4 seconds.
   */
  ngOnInit(): void {
    // this.shareddata.dashboard = false;
    // this.shareddata.login = true;
    // setTimeout(() => {
    //   const projectName = document.getElementById('intro');
    //   if (projectName) {
    //     projectName.classList.add('d-none');
    //   }
    // }, 4000);
  }
}
