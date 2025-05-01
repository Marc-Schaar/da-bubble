import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { UserService } from '../shared.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-imprint',
  imports: [HeaderComponent, RouterLink],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
})
export class ImprintComponent implements OnInit {
  shared = inject(UserService);

  /**
   * Lifecycle hook that is called when the component is initialized.
   * It sets the dashboard and login properties of the shared service to false.
   */
  ngOnInit(): void {
    this.shared.dashboard = false;
    this.shared.login = false;
  }
}
