import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-channel-edit',
  imports: [CommonModule],
  templateUrl: './channel-edit.component.html',
  styleUrl: './channel-edit.component.scss',
})
export class ChannelEditComponent {
  @Input() channelInfo:boolean = false;
  @Input() currentChannel:any = {};

  @Output() channelInfoChange = new EventEmitter<boolean>();  channelnameEdit: boolean = false;
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

  adjustTextareaHeight(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = `${textarea.scrollHeight}px`;
    if(textarea.value == '') {
      textarea.style.height = `60px`;
    }
  }

  close() {
    this.channelInfo = false;
    this.channelInfoChange.emit(this.channelInfo);
    console.log(this.channelInfo);
  }
}
