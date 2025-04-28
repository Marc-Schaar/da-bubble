import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject, ElementRef, ViewChild, Inject, HostListener } from '@angular/core';
import { collection, doc, getDoc, getDocs, updateDoc } from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { UserService } from '../../shared.service';
import { getAuth } from 'firebase/auth';
import { NavigationService } from '../../service/navigation/navigation.service';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-channel-edit',
  imports: [CommonModule],
  templateUrl: './channel-edit.component.html',
  styleUrl: './channel-edit.component.scss',
})
export class ChannelEditComponent {
  userService = inject(UserService);
  navigationService = inject(NavigationService);
  channelnameEdit: boolean = false;
  channeldescriptionEdit: boolean = false;
  users: any[] = [];
  auth = getAuth();

  currentChannel: any = {};
  currentChannelId: any;
  currentUser: any;

  constructor(
    public firestore: Firestore,
    public dialogRef: MatDialogRef<ChannelEditComponent>,
    @Inject(MAT_DIALOG_DATA) public data: any
  ) {
    this.currentChannel = data.currentChannel
    this.currentChannelId = data.currentChannelId;
    this.currentUser = data.currentUser;
  }

  ngOnInit() {
    this.fetchUsers();
  }

  @ViewChild('mainDialog') mainDialog!: ElementRef;
  @ViewChild('channelEditContainer') channelEditContainer!: ElementRef;

  async fetchUsers() {
    const usersCollection = collection(this.firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    this.users = usersSnapshot.docs.map((doc) => doc.data());
  }

  editChannelName(content: string) {
    if (content == 'editName') {
      if (!this.channelnameEdit) {
        this.channelnameEdit = true;
      } else {
        this.channelnameEdit = false;
        this.saveNewChannelData(content);
        this.userService.showFeedback('Channel Name geändert');
      }
    }
    if (content == 'editDescription') {
      if (!this.channeldescriptionEdit) {
        this.channeldescriptionEdit = true;
      } else {
        this.channeldescriptionEdit = false;
        this.saveNewChannelData(content);
        this.userService.showFeedback('Channel Beschreibung geändert');
      }
    }
  }

  async saveNewChannelData(content: string) {
    const newChannelName = document.getElementById('changeNameInput') as HTMLInputElement;
    const newChannelDescription = document.getElementById('changeDescriptionInput') as HTMLInputElement;
    const channelRef = doc(this.firestore, 'channels', this.currentChannelId);
    try {
      if (content == 'editName') {
        const ChannelNameRef = doc(this.firestore, 'channels', this.currentChannelId);

        await updateDoc(channelRef, {
          name: newChannelName.value,
        });
        this.currentChannel.name = newChannelName.value;
      }
      if (content == 'editDescription') {
        const ChannelNameRef = doc(this.firestore, 'channels', this.currentChannelId);

        await updateDoc(channelRef, {
          description: newChannelDescription.value,
        });
        this.currentChannel.description = newChannelDescription.value;
      }
    } catch (error) {
      console.error('Input Elemente nicht gefunden');
    }
  }

  adjustTextareaHeight(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = `${textarea.scrollHeight}px`;
    if (textarea.value == '') {
      textarea.style.height = `60px`;
    }
  }

  close() {
    this.dialogRef.close();
  }

  async exitChannel() {
    const channelRef = doc(this.firestore, 'channels', this.currentChannelId);
    const currentUser = this.userService.auth.currentUser;
    try {
      const channelDoc = await getDoc(channelRef);
      const channelData = channelDoc.data();
      if (channelData && currentUser) {
        let updateMember = [...channelData['member']];
        const index = updateMember.findIndex((member) => member.id === currentUser.uid);
        if (index !== -1) {
          updateMember.splice(index, 1);
        }
        await updateDoc(channelRef, {
          member: updateMember,
        });
      }
    } catch (error) {}
    this.dialogRef.close();
    this.userService.showFeedback('Channel verlassen');
    this.navigationService.showNewMessage(); 
    this.userService.setUrl('newMessage');
  }
}
