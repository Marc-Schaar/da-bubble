import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter, inject } from '@angular/core';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  updateDoc,
} from '@angular/fire/firestore';
import { Firestore } from '@angular/fire/firestore';
import { UserService } from '../../shared.service';
import { getAuth } from 'firebase/auth';

@Component({
  selector: 'app-channel-edit',
  imports: [CommonModule],
  templateUrl: './channel-edit.component.html',
  styleUrl: './channel-edit.component.scss',
})
export class ChannelEditComponent {
  @Input() channelInfo: boolean = false;
  @Input() currentChannel: any = {};
  @Input() currentChannelId: any;
  @Input() currentUser: any;
  userService = inject(UserService);
  @Output() channelInfoChange = new EventEmitter<boolean>();
  channelnameEdit: boolean = false;
  channeldescriptionEdit: boolean = false;
  users: any[] = [];
  auth = getAuth();

  constructor(public firestore: Firestore) {}

  ngOnInit() {
    this.fetchUsers();
  }

  async fetchUsers() {
    const usersCollection = collection(this.firestore, 'users');
    const usersSnapshot = await getDocs(usersCollection);
    this.users = usersSnapshot.docs.map((doc) => doc.data());
  }

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

  async saveNewChannelData(content: string) {
    const newChannelName = document.getElementById(
      'changeNameInput'
    ) as HTMLInputElement;
    const newChannelDescription = document.getElementById(
      'changeDescriptionInput'
    ) as HTMLInputElement;
    const channelRef = doc(this.firestore, 'channels', this.currentChannelId);
    try {
      if (content == 'editName') {
        const ChannelNameRef = doc(
          this.firestore,
          'channels',
          this.currentChannelId
        );

        await updateDoc(channelRef, {
          name: newChannelName.value,
        });
        this.currentChannel.name = newChannelName.value;
      }
      if (content == 'editDescription') {
        const ChannelNameRef = doc(
          this.firestore,
          'channels',
          this.currentChannelId
        );

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
    this.channelInfo = false;
    this.channelInfoChange.emit(this.channelInfo);
  }

  async exitChannel() {
    // const channelRef = doc(this.firestore, 'channels', this.currentChannelId);
    // try {
    //   const channelDoc = await getDoc(channelRef);
    //   const channelData = channelDoc.data();
    //   if (channelData) {
    //     const updatedMembers = channelData['member'].filter((member: string) => member !== this.currentUser.uid);
    //     await updateDoc(channelRef, {
    //       member: updatedMembers,
    //     });
    //   } else {
    //     console.error('Channel data is undefined');
    //   }
    // } catch (error) {
    //   console.error();
      
    // }
  }
}
