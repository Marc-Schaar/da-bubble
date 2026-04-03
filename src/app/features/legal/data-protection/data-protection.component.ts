import { Component, inject } from '@angular/core';

import { MessagesService } from '../../app_chat/services/messages/messages.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';

@Component({
  selector: 'app-dataprotection',
  imports: [HeaderComponent],
  templateUrl: './data-protection.component.html',
  styleUrl: './data-protection.component.scss',
})
export class DataprotectionComponent {
  message = inject(MessagesService);
}
