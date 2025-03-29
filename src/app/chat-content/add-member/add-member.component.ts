import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-add-member',
  imports: [CommonModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss'
})
export class AddMemberComponent {

  @Input() addMemberWindow:boolean = false
  @Input() currentChannel:any = {}
  @Input() currentChannelId: any;
  @Input() currentUser: any;
  @Output() addMemberWindowChange = new EventEmitter<boolean>();

  members: any[] = [];

  ngOnInit() {
    console.log(this.currentChannel);
    this.loadMember();
  }

  loadMember() {
    this.members = this.currentChannel['member']
  }

  closeWindow() {
    this.addMemberWindow = false;
    this.addMemberWindowChange.emit(this.addMemberWindow);    
  }


}
