import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../services/user/shared.service';
import { NavigationService } from '../services/navigation/navigation.service';
import { MessagesService } from '../services/messages/messages.service';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
  selector: 'app-dataprotection',
  imports: [HeaderComponent],
  templateUrl: './data-protection.component.html',
  styleUrl: './data-protection.component.scss',
})
export class DataprotectionComponent implements OnInit {
  shared = inject(UserService);
  navigate = inject(NavigationService);
  message = inject(MessagesService);

  /**
   * Initializes the component and sets dashboard and login flags to false.
   * This method is called once the component is initialized.
   */
  ngOnInit(): void {
    this.shared.dashboard = false;
    this.shared.login = false;
  }
}
