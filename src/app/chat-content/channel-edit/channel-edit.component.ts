import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { doc, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';

@Component({
  selector: 'app-channel-edit',
  imports: [CommonModule],
  templateUrl: './channel-edit.component.html',
  styleUrl: './channel-edit.component.scss',
})
export class ChannelEditComponent {
  @Input() channelInfo:boolean = false;
  @Input() currentChannel:any = {};

  @Output() channelInfoChange = new EventEmitter<boolean>();
  channelnameEdit: boolean = false;
  channeldescriptionEdit: boolean = false;

  constructor(public firestore: Firestore) {}

  editChannelName(content: string) {
    console.log(content);
    if (content == 'editName') {
      if (!this.channelnameEdit) {
        this.channelnameEdit = true;
      } else {
        this.channelnameEdit = false;
        this.saveNewChannelData(content);
      } 
    }
    if (content == 'editDescription') {
      if (!this.channeldescriptionEdit) {
        this.channeldescriptionEdit = true;
      } else {
        this.channeldescriptionEdit = false;
        this.saveNewChannelData(content);
      } 
    }
  }

  async saveNewChannelData(content:string) {
    const newChannelName = document.getElementById('changeNameInput') as HTMLInputElement;
    const newChannelDescription = document.getElementById('changeDescriptionInput') as HTMLInputElement;
    const ChannelNameRef = doc(this.firestore, 'channels', this.currentChannel.id);
    // const newChannelDescriptionRef = doc(this.firestore, 'channels', this.currentChannel.id)
    console.log(content);
    try {
      if(content == 'editName') {
        const ChannelNameRef = doc(this.firestore, 'channels', this.currentChannel.id);

        await updateDoc(ChannelNameRef, {
          name: newChannelName.value
        })
        this.currentChannel.name = newChannelName.value;

      }
      if(content == 'editDescription') {
        const ChannelNameRef = doc(this.firestore, 'channels', this.currentChannel.id);

        await updateDoc(ChannelNameRef, {
          description: newChannelDescription.value
        })
        this.currentChannel.description = newChannelDescription.value;

      }
    } catch (error) {
      console.error('Input Elemente nicht gefunden');
      
    }
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
  }

  exitChannel() {
    
  }
}
