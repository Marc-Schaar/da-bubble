import { Component, inject, OnInit } from '@angular/core';
import { UserService } from '../services/user/shared.service';
import { NavigationService } from '../services/navigation/navigation.service';
import { MessagesService } from '../services/messages/messages.service';
import { HeaderComponent } from '../shared/header/header.component';

@Component({
  selector: 'app-imprint',
  imports: [HeaderComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
})
export class ImprintComponent implements OnInit {
  shared = inject(UserService);
  navigate = inject(NavigationService);
  message = inject(MessagesService);

  /**
   * Lifecycle hook that is called when the component is initialized.
   * It sets the dashboard and login properties of the shared service to false.
   */
  ngOnInit(): void {
    this.shared.dashboard = false;
    this.shared.login = false;
  }
}
