import { Component, inject, Input } from '@angular/core';
import { MessagesService } from '../../service/messages/messages.service';

@Component({
  selector: 'app-divider-template',
  imports: [],
  templateUrl: './divider-template.component.html',
  styleUrl: './divider-template.component.scss',
})
export class DividerTemplateComponent {
  messagesService: MessagesService = inject(MessagesService);
  message: any;

  /**
   * Input property for message data. It contains the date and time when the message was sent.
   *
   * @example
   * messageData = { date: '2025-05-01', time: '14:30' }
   *
   * @type {{ date: string; time: string }}
   */
  @Input() messageData!: {
    date: string;
    time: string;
  };
}
