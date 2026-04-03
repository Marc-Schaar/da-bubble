import { Component, inject } from '@angular/core';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { NavigationService } from '../../../shared/services/navigation/navigation.service';
import { MessagesService } from '../../app_chat/services/messages/messages.service';

@Component({
  selector: 'app-imprint',
  imports: [HeaderComponent],
  templateUrl: './imprint.component.html',
  styleUrl: './imprint.component.scss',
})
export class ImprintComponent {
  navigate = inject(NavigationService);
  message = inject(MessagesService);
}
