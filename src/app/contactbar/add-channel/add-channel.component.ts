import { Component, OnInit, Inject, PLATFORM_ID, inject, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule, isPlatformBrowser, NgClass, NgFor, NgIf } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { FormsModule, FormControl, ReactiveFormsModule } from '@angular/forms';
import { Firestore, collection, getDocs, addDoc, updateDoc, doc, getDoc, arrayUnion } from '@angular/fire/firestore';
import { UserService } from '../../services/user/shared.service';
import { getAuth } from 'firebase/auth';
import { User } from '../../models/user/user';
import { Channel } from '../../models/channel/channel';
import { FireServiceService } from '../../services/firebase/fire-service.service';
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
  isMobile: boolean = false;
  isNameTaken: boolean = false;
  @ViewChild('mainDialog') mainDialog!: ElementRef;
  @ViewChild('userSearchInput') userSearchInput!: ElementRef;
  @ViewChild('chooseUserBar') chooseUserBar!: ElementRef;

  /**
   * Constructor for AddChannelComponent. Initializes the component with the platform ID,
   * Firestore service, and dialog reference.
   *
   * @param platformId - Platform ID, used to determine the platform the app is running on (e.g., browser or server).
   * @param firestore - Firestore service instance for interacting with the Firestore database.
   * @param dialogRef - Reference to the dialog for controlling the dialog box.
   */
  constructor(
    @Inject(PLATFORM_ID) private platformId: Object,
    public firestore: Firestore,
    public dialogRef: MatDialogRef<AddChannelComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { channels: any[] }
  ) {
    if (data && data.channels) {
      this.channels = data.channels;
    }
  }

  /**
   * Initializes the component by loading users and channel data.
   *
   * @returns {void}
   */
  ngOnInit() {
    this.loadUsers();
  }

  /**
   * Filters the users based on the input from the search bar and updates the list of filtered users.
   *
   * @returns {void}
   */
  filterUsers() {
    let filter = document.getElementById('user-search-bar') as HTMLInputElement | null;
    if (filter) {
      const filterValue = filter.value.toLowerCase();
      this.filteredUsers = this.users
        .filter((user) => user.fullname.toLowerCase().includes(filterValue))
        .filter((user) => !user.isAnonymous)
        .filter((user) => !this.selectedUsers.some((selected) => selected.uid === user.uid))
    } else {
      this.filteredUsers = this.users.filter((user) => !this.selectedUsers.some((selected) => selected.uid === user.uid));
    }
  }

  /**
   * Loads the users from Firestore and stores them in the component's `users` property.
   *
   * @returns {Promise<void>}
   */
  async loadUsers() {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const querySnapshot = await getDocs(usersCollection);
      this.users = querySnapshot.docs.map((doc) => {
        return { ...doc.data(), uid: doc.id };
      });
    } catch (error) {
      this.users = [];
    }
  }

  /**
   * Adds a user to the selection list from the filtered users.
   *
   * @param {number} index - The index of the user to add to the selection.
   * @returns {void}
   */
  addUserToSelection(index: number) {
    const selectedUser = this.filteredUsers[index];
    this.selectedUsers.push(selectedUser);
    this.filteredUsers.splice(index, 1);
    this.filterUsers();
    this.refreshBar();
  }

  /**
   * Removes a user from the selection bar by index.
   *
   * @param {number} index - The index of the user to remove.
   * @returns {void}
   */
  removeUserFromBar(index: number) {
    this.users.splice(index, 1);
    this.filterUsers();
  }

  /**
   * Removes a selected user from the selection and adds them back to the users list.
   *
   * @param {number} index - The index of the selected user to remove.
   * @returns {void}
   */
  removeSelectedUser(index: number) {
    const removedUser = this.selectedUsers[index];
    if (!this.users.some((user) => user.uid === removedUser.uid)) {
      this.users.push(removedUser);
    }
    this.selectedUsers.splice(index, 1);
    this.filterUsers();
  }

  /**
   * Adds a user back to the user bar from the selected users list.
   *
   * @param {number} index - The index of the selected user to add back to the user bar.
   * @returns {void}
   */
  addUserToBar(index: number) {
    this.users.push(this.selectedUsers[index]);
    this.selectedUsers.splice(index, 1);
    this.filterUsers();
  }

  /**
   * Refreshes the user search bar input field.
   *
   * @returns {void}
   */
  refreshBar() {
    const refresh = document.getElementById('user-search-bar') as HTMLInputElement | null;
    if (refresh) {
      refresh.value = '';
    }
  }

  /**
   * Closes the current dialog.
   *
   * @returns {void}
   */
  closeScreen() {
    if (this.isMobile && this.selectChannelMember) {
      this.selectChannelMember = false;
    } else this.dialogRef.close();
  }

  /**
   * Handles form submission to create a new channel.
   * check if the channel name already exists
   * @returns {void}
   */
  onSubmit() {
    if (!this.selectChannelMember) {
      const channelNameExists = this.channels.some((channel: { name: string }) => channel.name === this.channelName);
      if (channelNameExists) {
        this.isNameTaken = true;
      } else {
        this.addChannel();
        this.channelmodule.showFeedback('Channel erstellt');
        this.selectChannelMember = true;
      }
      if (isPlatformBrowser(this.platformId)) {
        if (window.innerWidth <= 1023) {
          this.isMobile = true;
        }
      }
    }
  }

  /**
   * Adds users to the channel based on the selection type (all users or selected users).
   *
   * @returns {void}
   */
  addUserToChannel() {
    if (!this.chooseMember) {
      this.pushAllUser();
      this.channelmodule.showFeedback('User zum Channel hinzugefügt');
    } else {
      this.pushSelectedUser();
      this.channelmodule.showFeedback('User zum Channel hinzugefügt');
    }
  }

  /**
   * Pushes selected users to the target channel.
   *
   * @returns {Promise<void>}
   */
  async pushSelectedUser() {
    try {
      const targetChannelRef = doc(this.firestore, 'channels', this.channelRef);
      const targetChannelDoc = await getDoc(targetChannelRef);
      if (targetChannelDoc.exists()) {
        const targetChannelData = targetChannelDoc.data();
        await updateDoc(targetChannelRef, { member: arrayUnion(...this.selectedUsers) });
        this.selectedUsers = [];
      } else {
      }
    } catch (error) {}
    this.dialogRef.close();
  }

  /**
   * Pushes all users to the target channel.
   *
   * @returns {Promise<void>}
   */
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
      } else {
      }
    } catch (error) {}
    this.dialogRef.close();
  }

  /**
   * Adds a new channel to the Firestore database.
   *
   * @returns {Promise<void>}
   */
  async addChannel() {
    const channelDescriptionElement = document.getElementById('channel-description') as HTMLInputElement | null;
    const descriptionValue = channelDescriptionElement ? channelDescriptionElement.value : '';
    const currentUserAuth = this.auth.currentUser;
    if (!currentUserAuth) {
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
      this.channelmodule.showFeedback('Fehler beim Erstellen des Channels.');
    }
  }

  /**
   * Sets the channel member selection state and adjusts the height of the channel section.
   *
   * @param {boolean} value - Whether to choose members or not.
   * @param {string} setHeight - The height to set for the channel section.
   * @returns {void}
   */
  setChannelMember(value: boolean, setHeight: string) {
    if (!this.isMobile) {
      const heightElement = document.getElementById('add-channel-cont') as HTMLElement;
      this.chooseMember = value;
      if (heightElement) {
        heightElement.style.height = setHeight;
      }
    }
    const heightElement = document.getElementById('add-channel-cont') as HTMLElement;
    this.chooseMember = value;
  }

  /**
   * Adjusts the height of the textarea based on its content.
   *
   * @param {Event} event - The event object triggered by the textarea input.
   * @returns {void}
   */
  adjustTextareaHeight(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = 'auto';
    if (textarea.scrollHeight > 90) {
      textarea.style.height = `${textarea.scrollHeight}px`;
    } else {
      textarea.style.height = '90px';
    }
  }

  /**
   * Expands the textarea height based on its content.
   *
   * @param {Event} event - The event object triggered by the textarea input.
   * @returns {void}
   */
  expandTextarea(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = '90px';
    if (textarea.scrollHeight > 90) {
      textarea.style.height = `${textarea.scrollHeight}px`;
    }
  }

  /**
   * Shrinks the textarea height to its minimum size.
   *
   * @param {Event} event - The event object triggered by the textarea input.
   * @returns {void}
   */
  shrinkTextarea(event: Event) {
    const textarea = event.target as HTMLTextAreaElement;
    textarea.style.height = '60px';
  }

  /**
   * Opens the user selection bar.
   *
   * @returns {void}
   */
  openUserBar() {
    this.showUserBar = true;
    this.filterUsers();
  }

  /**
   * Closes the user bar if clicked outside the input or bar.
   *
   * @param {Event} event - The click event object.
   * @returns {void}
   */
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
