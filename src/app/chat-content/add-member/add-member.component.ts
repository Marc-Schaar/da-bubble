import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-add-member',
  imports: [CommonModule],
  templateUrl: './add-member.component.html',
  styleUrl: './add-member.component.scss'
})
export class AddMemberComponent {

  @Input() addMemberInfoWindow:boolean = false
  @Output() addMemberInfoWindowChange = new EventEmitter<boolean>();

  @Input() currentChannel:any = {}
  @Input() currentChannelId: any;
  @Input() addMemberWindow:boolean = false;
  @Output() addMemberWindowChange = new EventEmitter<boolean>();
  @Input() currentUser: any;
  members: any[] = [];
  

  ngOnInit() {
    this.loadMember();
  }

  changeWindow() {
    this.addMemberWindow = true;
  }

  loadMember() {
    this.members = this.currentChannel['member']
  }

  closeWindow() {
    this.addMemberInfoWindow = false;
    this.addMemberInfoWindowChange.emit(this.addMemberInfoWindow);    
  }


}
