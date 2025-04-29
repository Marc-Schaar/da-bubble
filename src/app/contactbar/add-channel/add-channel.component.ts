import { Component, OnInit, Inject, PLATFORM_ID, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgClass, NgFor, NgIf } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, addDoc, updateDoc, doc, getDoc, arrayUnion } from '@angular/fire/firestore';
import { UserService } from '../../shared.service';
import { getAuth } from 'firebase/auth';
import { User } from '../../models/user/user';
import { Channel } from '../../models/channel/channel';
import { FireServiceService } from '../../fire-service.service';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

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
  addMemberInfoWindow: boolean = false;

  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public firestore: Firestore,
    public dialogRef: MatDialogRef<AddChannelComponent>
  ) {}

  ngOnInit() {
    this.loadUsers();
    this.loadChannel();
    console.log(this.channel);
    console.log(this.auth.currentUser);
  }

  @ViewChild('mainDialog') mainDialog!: ElementRef;
  @ViewChild('userSearchInput') userSearchInput!: ElementRef;
  @ViewChild('chooseUserBar') chooseUserBar!: ElementRef;

  filterUsers() {
    let filter = document.getElementById('user-search-bar') as HTMLInputElement | null;
    if (filter) {
      const filterValue = filter.value.toLowerCase();
      this.filteredUsers = this.users
        .filter((user) => user.fullname.toLowerCase().includes(filterValue))
        .filter((user) => !this.selectedUsers.some((selected) => selected.uid === user.uid));
    } else {
      this.filteredUsers = this.users.filter((user) => !this.selectedUsers.some((selected) => selected.uid === user.uid));
    }
  }

  async loadUsers() {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersCollection);
      this.users = querySnapshot.docs.map((doc) => {
        return { ...doc.data(), uid: doc.id };
      });
    } catch (error) {
      console.error('Error loading users:', error);
      this.users = [];
    }
  }
  async loadChannel() {
    this.channels = this.channelmodule.getChannels();
  }

  addUserToSelection(index: number) {
    const selectedUser = this.filteredUsers[index];
    this.selectedUsers.push(selectedUser);
    this.filteredUsers.splice(index, 1);
    this.filterUsers();
    this.refreshBar();
  }

  removeUserFromBar(index: number) {
    this.users.splice(index, 1);
    this.filterUsers();
  }

  removeSelectedUser(index: number) {
    const removedUser = this.selectedUsers[index];
    if (!this.users.some((user) => user.uid === removedUser.uid)) {
      this.users.push(removedUser);
    }
    this.selectedUsers.splice(index, 1);
    this.filterUsers();
  }

  addUserToBar(index: number) {
    this.users.push(this.selectedUsers[index]);
    this.selectedUsers.splice(index, 1);
    this.filterUsers();
    console.log(this.users);
    console.log(this.filteredUsers);
  }

  refreshBar() {
    const refresh = document.getElementById('user-search-bar') as HTMLInputElement | null;
    if (refresh) {
      console.log('refresh');
      refresh.value = '';
    }
  }

  closeScreen() {
    this.dialogRef.close();
  }

  onSubmit() {
    if (!this.selectChannelMember) {
      this.addChannel();
      this.channelmodule.showFeedback('Channel erstellt');
      this.selectChannelMember = true;
    }
  }

  addUserToChannel() {
    if (!this.chooseMember) {
      this.pushAllUser();
      this.channelmodule.showFeedback('User zum Channel hinzugefügt');
    } else {
      this.pushSelectedUser();
      this.channelmodule.showFeedback('User zum Channel hinzugefügt');
    }
  }

  async pushSelectedUser() {
    try {
      const targetChannelRef = doc(this.firestore, 'channels', this.channelRef);
      const targetChannelDoc = await getDoc(targetChannelRef);
      if (targetChannelDoc.exists()) {
        const targetChannelData = targetChannelDoc.data();
        await updateDoc(targetChannelRef, { member: arrayUnion(...this.selectedUsers) });
        this.selectedUsers = [];
      } else {
        console.error('Fehler: Der Channel existiert nicht.');
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der ausgewählten Benutzer:', error);
    }
    this.dialogRef.close();
  }

  async pushAllUser() {
    try {
      const channelId = 'KqvcY68R1jP2UsQkv6Nz';
      const mainChannelRef = doc(this.firestore, 'channels', channelId);
      const mainChannelDoc = await getDoc(mainChannelRef);
      const targetChannelRef = doc(this.firestore, 'channels', this.channelRef);
      const targetChannelDoc = await getDoc(targetChannelRef);
      if (mainChannelDoc.exists() && targetChannelDoc.exists()) {
        const mainChannelData = mainChannelDoc.data();
        const targetChannelData = targetChannelDoc.data();
        await updateDoc(targetChannelRef, {
          member: mainChannelData['member'],
        });
        console.log('Alle Mitglieder erfolgreich hinzugefügt.');
      } else {
        console.error('Fehler: Ein oder beide Channel existieren nicht.');
      }
    } catch (error) {
      console.error('Fehler beim Hinzufügen der Benutzer:', error);
    }
    this.dialogRef.close();
  }

  async addChannel() {
    const channelDescriptionElement = document.getElementById('channel-description') as HTMLInputElement | null;
    const descriptionValue = channelDescriptionElement ? channelDescriptionElement.value : '';
    const currentUserAuth = this.auth.currentUser;
    if (!currentUserAuth) {
      console.error('Fehler: Kein Benutzer eingeloggt.');
      this.channelmodule.showFeedback('Fehler: Sie müssen eingeloggt sein.');
      return;
    }
    const creatorProfile = this.users.find((u) => u.uid === currentUserAuth.uid);
    if (!creatorProfile) {
      this.channelmodule.showFeedback('Fehler: Benutzerprofil konnte nicht geladen werden.');
      return;
    }
    try {
      const creatorMember = {
        id: creatorProfile.uid,
        fullname: creatorProfile.fullname,
        profilephoto: creatorProfile.profilephoto,
        email: creatorProfile.email,
        online: creatorProfile.online,
      };
      const channelData = {
        name: this.channelName,
        description: descriptionValue,
        member: [creatorMember],
        creator: creatorProfile.fullname ?? 'Unknown',
      };
      const channelsCollection = collection(this.firestore, 'channels');
      const channelRef = await addDoc(channelsCollection, channelData);
      this.channelRef = channelRef.id;
      this.channelmodule.showFeedback('Channel erstellt');
    } catch (error) {
      console.error('Fehler beim Erstellen des Channels:', error);
      this.channelmodule.showFeedback('Fehler beim Erstellen des Channels.');
    }
  }

  setChannelMember(value: boolean, setHeight: string) {
    const heightElement = document.getElementById('add-channel-cont') as HTMLElement;
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
    this.showUserBar = true;
    this.filterUsers();
  }

  @HostListener('document:click', ['$event'])
  closeUserBar(event: Event) {
    const targetElement = event.target as Node;
    const clickedInsideInput = this.userSearchInput?.nativeElement?.contains(targetElement);
    const clickedInsideBar = this.chooseUserBar?.nativeElement?.contains(targetElement);
    if (!clickedInsideInput && !clickedInsideBar) {
      this.showUserBar = false;
    }
  }
}
