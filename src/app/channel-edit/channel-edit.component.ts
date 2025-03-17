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

}
