import { Component, inject, Input } from '@angular/core';
import { MessagesService } from '../../../service/messages/messages.service';

@Component({
  selector: 'app-divider-template',
  imports: [],
  templateUrl: './divider-template.component.html',
  styleUrl: './divider-template.component.scss',
})
export class DividerTemplateComponent {
  messagesService: MessagesService = inject(MessagesService);
  message: any;

  @Input() messageData!: {
    date: string;
    time: string;
  };
}
