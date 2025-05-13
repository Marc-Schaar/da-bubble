import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { UserService } from '../services/user/shared.service';
import { NavigationService } from '../services/navigation/navigation.service';

@Component({
  selector: 'app-imprint',
  imports: [HeaderComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
})
export class ImprintComponent implements OnInit {
  shared = inject(UserService);
  navigate = inject(NavigationService);

  /**
   * Lifecycle hook that is called when the component is initialized.
   * It sets the dashboard and login properties of the shared service to false.
   */
  ngOnInit(): void {
    this.shared.dashboard = false;
    this.shared.login = false;
  }
}
