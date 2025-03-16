import {
  Component,
  OnInit,
  Inject,
  PLATFORM_ID,
  NgModule,
  inject,
} from '@angular/core';
import {
  CommonModule,
  isPlatformBrowser,
  NgClass,
  NgFor,
  NgIf,
} from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import * as AOS from 'aos';
import 'aos/dist/aos.css';
import {
  Firestore,
  collection,
  getDocs,
  addDoc,
  updateDoc,
  doc,
} from '@angular/fire/firestore';
import { UserService } from '../shared.service';
import { getAuth } from 'firebase/auth';
import { User } from '../../models/user.class';
import { Channel } from '../../models/channels.class';
import { FireServiceService } from '../fire-service.service';

@Component({
  selector: 'app-add-channel',
  imports: [CommonModule, FormsModule, NgClass, NgIf, NgFor, MatRadioModule],
  templateUrl: './add-channel.component.html',
  styleUrls: ['./add-channel.component.scss'],
})
export class AddChannelComponent implements OnInit {
  channelName: string = '';
  channelDescription: string = '';
  selectChannelMember: boolean = false;
  chooseMember: boolean = false;
  auth = getAuth();
  user: User | null = null;
  displayName: string | null = null;
  photoURL: string | null = null;
  uid: string | null = null;
  users: any[] = [];
  selectedUsers: any[] = [];
  filteredUsers: any[] = [];
  showUserBar: boolean = false;
  channelmodule = inject(UserService);
  fireService = inject(FireServiceService);
  channel = new Channel();
  channels: any = [];
  addNewChannel:boolean = true;
  addUser:boolean = false;
  allUser:boolean = true;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public firestore: Firestore
  ) {}

  ngOnInit() {
    if (isPlatformBrowser(this.platformId)) {
      AOS.init();
    }
    this.loadUsers();
    this.loadChannel();
    document.addEventListener('click', this.handleOutsideClick.bind(this));
    console.log(this.channel);
  }

  handleOutsideClick(event: Event) {
    const inputField = document.getElementById('user-search-bar');
    if (inputField && !inputField.contains(event.target as Node)) {
      this.showUserBar = false;
    }
  }

  filterUsers() {
    let filter = document.getElementById(
      'user-search-bar'
    ) as HTMLInputElement | null;
    if (filter) {
      const filterValue = filter.value.toLowerCase();
      this.filteredUsers = this.users.filter((user) =>
        user.fullname.toLowerCase().includes(filterValue)
      );
    } else {
      this.filteredUsers = this.users;
    }
  }

  async loadUsers() {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersCollection);
      this.users = querySnapshot.docs.map((doc) => doc.data());
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = []; // Default to empty array if there's an error
    }
  }

  async loadChannel() {
    this.channels = this.channelmodule.getChannels();
  }

  addUserToSelection(index: number) {
    this.selectedUsers.push(this.filteredUsers[index]);
    this.removeUserFromBar(index);
    this.refreshBar();
  }

  removeUserFromBar(index: number) {
    this.users.splice(index, 1);
    this.filterUsers();
    console.log(this.users);
    console.log(this.filteredUsers);
  }

  removeSelectedUser(index: number) {
    this.addUserToBar(index);
    this.selectedUsers.splice(index, 1);
  }

  addUserToBar(index: number) {
    this.users.push(this.selectedUsers[index]);
    this.filterUsers();
    console.log(this.users);
    console.log(this.filteredUsers);
  }

  refreshBar() {
    const refresh = document.getElementById(
      'user-search-bar'
    ) as HTMLInputElement | null;
    if (refresh) {
      console.log('refresh');
      refresh.value = '';
    }
  }

  closeScreen() {
    console.log('close window');

    // Reset form fields
    this.channelName = ''; // Clear channel name input
    this.channelDescription = ''; // Clear channel description input

    // Clear selected users
    this.selectedUsers = [];

    // Reset user bar visibility
    this.showUserBar = false;

    // Log current state (for debugging)
    console.log('Users:', this.users);
    console.log(
      'Channel Members:',
      this.channelmodule.channels[0]?.data?.member
    );
  }

  onSubmit() {
    if (!this.selectChannelMember && this.addNewChannel) {
      this.addChannel();
      // this.pushAllUsers();
      console.log('channel erstellt');
      this.addNewChannel = false;
      this.addUser = true;
    }  
    if (!this.selectChannelMember && this.addUser) {
      // this.addUserToChannel()
      this.addNewChannel = true;
      this.addUser = false;
    }
    this.selectChannelMember = true;
    // console.log(this.channelmodule.channels);
  }

async addChannel() {
  try {
    const newChannel: Channel = {
      name: this.channelName,
      description: this.channelDescription,
      member: this.selectedUsers,
      messages: [],
    };
    const channelsCollection = collection(this.firestore, 'channels');
    await addDoc(channelsCollection, {
      name: newChannel.name,
      description: newChannel.description,
      member: newChannel.member,
      messages: newChannel.messages, 
    });
    this.channelName = '';
    this.channelDescription = '';
    this.selectedUsers = [];
  } catch (error) {
    console.error('Fehler beim Erstellen des Channels:', error);
  }
}

// async pushAllUsers() {
//   try {
//     const allUser = this.users
//     const channel = this.channelmodule.channels[0];
//     if (channel) {
//       const channelRef = doc(this.firestore, 'channels', channel.key);
//       const updatedMembers = [...new Set([...channel.data.member, ...allUser])]; // Doppelte Einträge vermeiden
//       await updateDoc(channelRef, {
//         member: updatedMembers,
//       });
//       console.log('Alle Benutzer wurden dem Channel "DaBubble" hinzugefügt.');
//     } else {
//       console.error('Channel "DaBubble" nicht gefunden.');
//     }
//   } catch (error) {
//     console.error('Fehler beim Hinzufügen der Benutzer zum Channel:', error);
//   }
//   console.log(this.channelmodule.channels[0].data.member);
// }


  setChannelMember(value: boolean, setHeight: string) {
    const heightElement = document.getElementById(
      'add-channel-cont'
    ) as HTMLElement;
    this.chooseMember = value;
    if (heightElement) {
      heightElement.style.height = setHeight;
    }
  }

  adjustTextareaHeight(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    if (textarea.scrollHeight > 90) {
      textarea.style.height = `${textarea.scrollHeight}px`;
    } else {
      textarea.style.height = '90px';
    }
  }

  expandTextarea(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = '90px';
    if (textarea.scrollHeight > 90) {
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }

  shrinkTextarea(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = '60px';
  }

  openUserBar() {
    this.showUserBar = !this.showUserBar;
    this.filterUsers();
  }
}
