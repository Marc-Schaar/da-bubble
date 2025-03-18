import { CommonModule } from '@angular/common';
import { Component, inject, Injectable } from '@angular/core';
import { Firestore } from '@angular/fire/firestore';
import { FireServiceService } from '../fire-service.service';
import { UserService } from '../shared.service';

import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root',
})
@Component({
  selector: 'app-contactbar',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './contactbar.component.html',
  styleUrl: './contactbar.component.scss',
})
export class ContactbarComponent {
  constructor(private router: Router) {}
  public channels: any = [];
  public users: any = [];
  active: boolean = false;
  message: boolean = false;
  userService = inject(UserService);
  firestore = inject(Firestore);
  firestoreService = inject(FireServiceService);
  currentUser: any = [];
  currentReceiver: any;
  userID: string = '';
  currentChannel: any;

  async ngOnInit() {
    await this.loadUsers();
    await this.loadChannels();
    this.findCurrentUser();
  }

  async loadUsers() {
    try {
      this.users = await this.firestoreService.getUsers();
    } catch (error) {
      console.error('Error loading users in component:', error);
    }
  }

  async loadChannels() {
    try {
      this.channels = await this.firestoreService.getChannels();
    } catch (error) {
      console.error('Error loading channels in component:', error);
    }
  }

  findCurrentUser() {
    if (this.userService.user?.uid) {
      this.userID = this.userService.user.uid;
      this.currentUser = this.users.find(
        (user: any) => this.userID === user.id
      );
    } else {
      console.log('user wurde nicht richtig geladen');
    }
  }

  setUrl(channelType: string) {
    this.router.navigate(['/chat'], {
      queryParams: { channelType: channelType },
    });
  }
  openChannel(index: any) {
    this.currentChannel = this.channels[index];

    this.userService.getChannel(this.currentChannel, this.currentUser);
  }

  openPersonalChat(index: any) {
    this.currentReceiver = this.users[index];
    this.userService.getReciepent(this.currentReceiver, this.currentUser);
  }

  toggleActive() {
    this.active = !this.active;
  }

  toggleMessage() {
    this.message = !this.message;
  }

  isOpen() {
    return this.message === true;
  }

  isActive() {
    return this.active === true;
  }

  openWindow(window: string) {
    this.userService.loadComponent(window);
  }
}
