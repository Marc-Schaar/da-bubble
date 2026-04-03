import { Component, computed, input } from '@angular/core';

@Component({
  selector: 'app-divider-template',
  imports: [],
  templateUrl: './divider-template.component.html',
  styleUrl: './divider-template.component.scss',
})
export class DividerTemplateComponent {
  messageData = input.required<Date | any>();

  formattedDate = computed(() => {
    const raw = this.messageData();
    if (!raw) return '';
    console.log(raw);

    const date = typeof raw.toDate === 'function' ? raw.toDate() : new Date(raw);

    const today = new Date();
    const isToday =
      date.getDate() === today.getDate() && date.getMonth() === today.getMonth() && date.getFullYear() === today.getFullYear();

    if (isToday) return 'Heute';

    return date.toLocaleDateString('de-DE', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
    });
  });
}
