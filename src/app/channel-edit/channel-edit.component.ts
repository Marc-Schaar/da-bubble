import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-channel-edit',
  imports: [CommonModule],
  templateUrl: './channel-edit.component.html',
  styleUrl: './channel-edit.component.scss',
})
export class ChannelEditComponent {
  channelnameEdit: boolean = false;
  channeldescriptionEdit: boolean = false;

  editChannelName(content: string) {
    console.log(content);
    if (content == 'editName') {
      if (!this.channelnameEdit) {
        this.channelnameEdit = true;
      } else this.channelnameEdit = false;
    }
    if (content == 'editDescription') {
      if (!this.channeldescriptionEdit) {
        this.channeldescriptionEdit = true;
      } else this.channeldescriptionEdit = false;
    }
  }

  saveNewChannelData() {
    console.log('Neuer Channelbeschreibung gespeichert');
  }
}
