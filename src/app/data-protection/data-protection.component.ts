import { Component, inject, OnInit } from '@angular/core';
import { HeaderComponent } from '../header/header.component';
import { UserService } from '../services/user/shared.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dataprotection',
  imports: [HeaderComponent, RouterLink],
  templateUrl: './data-protection.component.html',
  styleUrl: './data-protection.component.scss',
})
export class DataprotectionComponent implements OnInit {
  shared = inject(UserService);

  /**
   * Initializes the component and sets dashboard and login flags to false.
   * This method is called once the component is initialized.
   */
  ngOnInit(): void {
    this.shared.dashboard = false;
    this.shared.login = false;
  }
}
