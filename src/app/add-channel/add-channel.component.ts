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
  getDoc,
} from '@angular/fire/firestore';
import { UserService } from '../shared.service';
import { getAuth } from 'firebase/auth';
import { User } from '../models/user';
import { Channel } from '../models/channel';
import { FireServiceService } from '../fire-service.service';

@Component({
  selector: 'app-add-channel',
  imports: [CommonModule, FormsModule, NgClass, NgIf, NgFor, MatRadioModule],
  templateUrl: './add-channel.component.html',
  styleUrls: ['./add-channel.component.scss'],
})
export class AddChannelComponent implements OnInit {
  channelName: string = '';
  selectChannelMember: boolean = false;
  channelDescription: HTMLInputElement | null = null;
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
  allUser: boolean = true;
  creator: string = '';
  channelRef: string = '';

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
    // this.channelName = '';
    // this.channelDescription = '';
    // this.selectedUsers = [];
    // this.showUserBar = false;
    console.log(this.auth.currentUser);

    // console.log('Users:', this.users);
    console.log('Channel Members:', this.channelmodule.channels);
  }

  onSubmit() {
    if (!this.selectChannelMember) {
      this.addChannel();
      console.log('channel erstellt');
      console.log(this.channelmodule.getChannel);

      this.selectChannelMember = true;
    }
  }

  addUserToChannel() {
    if (!this.chooseMember) {
      this.pushAllUser();
    } else {
      this.pushSelectedUser();
    }
    console.log('user added');
  }

  async pushSelectedUser() {
    try {  
      const targetChannelRef = doc(this.firestore, 'channels', this.channelRef);
      const targetChannelDoc = await getDoc(targetChannelRef);
      if (targetChannelDoc.exists()) {
        const targetChannelData = targetChannelDoc.data();
        await updateDoc(targetChannelRef, { member: this.selectedUsers });
        this.selectedUsers = [];
      } else {
        console.error('Fehler: Der Channel existiert nicht.');
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der ausgewählten Benutzer:', error);
    }
  }
  

  async pushAllUser() {
    try {
      const channelId = 'LPRVbdSLkaDmZSzumHJA';
      const mainChannelRef = doc(this.firestore, 'channels', channelId);
      const mainChannelDoc = await getDoc(mainChannelRef);
      const targetChannelRef = doc(this.firestore, 'channels', this.channelRef);
      const targetChannelDoc = await getDoc(targetChannelRef);
      if (mainChannelDoc.exists() && targetChannelDoc.exists()) {
        const mainChannelData = mainChannelDoc.data();
        const targetChannelData = targetChannelDoc.data();
        await updateDoc(targetChannelRef, { member: mainChannelData['member'] });
        console.log('Alle Mitglieder erfolgreich hinzugefügt.');
      } else {
        console.error('Fehler: Ein oder beide Channel existieren nicht.');
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Benutzer:', error);
    }
  }
  
  

  async addChannel() {
    const channelDescription = document.getElementById(
      'channel-description'
    ) as HTMLInputElement | null;
    try {
      const newChannel: Channel = {
        name: this.channelName,
        description: channelDescription ? channelDescription.value : '',
        member: this.selectedUsers,
        creator: this.auth.currentUser?.displayName ?? 'Unknown',
      };
      const channelsCollection = collection(this.firestore, 'channels');
      const channelRef = await addDoc(channelsCollection, {
        name: newChannel.name,
        description: newChannel.description,
        member: newChannel.member,
        creator: newChannel.creator,
      });
      this.channelRef = channelRef.id;
      console.log('Channel erstellt mit ID:', channelRef.id);

      this.channelName = '';
      if (this.channelDescription) {
        this.channelDescription.value = '';
      }
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
