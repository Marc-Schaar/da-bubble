import { Component, inject, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HeaderComponent } from '../header/header.component';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { ContactbarComponent } from '../contactbar/contactbar.component';
import { Subscription } from 'rxjs';
import { UserService } from '../shared.service';
import { ThreadComponent } from '../thread/thread.component';
import { FireServiceService } from '../fire-service.service';
import { ChatContentComponent } from '../chat-content/chat-content.component';
import { DirectmessagesComponent } from '../direct-messages/direct-messages.component';
import { NewmessageComponent } from '../newmessage/newmessage.component';

@Component({
  selector: 'app-main-chat',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    CommonModule,
    FormsModule,
    HeaderComponent,
    MatSidenavModule,
    ContactbarComponent,
    ThreadComponent,
    ChatContentComponent,
    DirectmessagesComponent,
    NewmessageComponent,
  ],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss',
})
export class MainChatComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatDrawer;
  shareddata = inject(UserService);
  fireService: FireServiceService = inject(FireServiceService);

  showFiller = true;
  isMobile: boolean = false;
  isProfileCard: boolean = false;
  currentReciever: any;
  darkBackground: boolean = false;
  private componentSubscription: Subscription | null = null;
  private threadSubscription!: Subscription;
  private subscription!: Subscription;

  //Neue Logik ab hier:
  currentComponent: any;
  channelType: string = 'default';
  channelMessages: any = [];
  docId: string = '';

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.shareddata.dashboard = true;
    this.shareddata.login = false;

    // this.componentSubscription = this.shareddata.component$.subscribe(() => {
    //this.currentComponent = component;
    // console.log('Aktuelle Komponente:', component);
    // });

    this.shareddata.component$.subscribe(() => {
      this.currentComponent = this.shareddata.channelType;
      console.log('Aktuelle Komponente:', this.currentComponent);
      if (this.currentComponent === 'direct') this.shareddata.toggleThread('close');
      this.cdr.detectChanges();
    });

    this.subscription = this.shareddata.openProfile$.subscribe(() => {
      this.openProfile();
    });

    this.threadSubscription = this.shareddata.threadToggle$.subscribe((value: string) => {
      value === 'open' ? this.drawer.open() : this.drawer.close();
    });
  }

  ngOnDestroy(): void {
    if (this.componentSubscription) {
      this.componentSubscription.unsubscribe();
    }
  }

  closeProfile() {
    this.isProfileCard = false;
  }

  openProfile() {
    this.currentReciever = this.shareddata.currentReciever; // muss nach dem reload der currentReciever neu gesetzt werden
    this.isProfileCard = !this.isProfileCard;
    console.log('OPEN');
    console.log(this.isProfileCard);
  }
}
