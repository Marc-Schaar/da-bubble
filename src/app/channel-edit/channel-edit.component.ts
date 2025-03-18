import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';

@Component({
  selector: 'app-channel-edit',
  imports: [CommonModule],
  templateUrl: './channel-edit.component.html',
  styleUrl: './channel-edit.component.scss'
})
export class ChannelEditComponent {

  channelnameEdit:boolean = false;
  channeldescriptionEdit:boolean = false;


  editChannelName() {
    if (!this.channelnameEdit) {
      this.channelnameEdit = true;
    } else {
      this.channelnameEdit = false;
      this.saveNewChannelname()
    }
    if (!this.channeldescriptionEdit) {
      this.channeldescriptionEdit = true;
    } else {
      this.channeldescriptionEdit = false;
      this.saveNewChannelDescription()
    }
  }

  saveNewChannelDescription() {
    console.log('Neuer Channelbeschreibung gespeichert');

  }

  saveNewChannelname() {
    console.log('Neuer Channelname gespeichert');
    
  }
}
