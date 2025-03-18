import { Component, inject, ViewChild, OnInit } from '@angular/core';
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
import { ActivatedRoute, Router } from '@angular/router';

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
  ],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss',
})
export class MainChatComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatDrawer;
  shareddata = inject(UserService);
  router: Router = inject(Router);
  showFiller = true;
  isMobile: boolean = false;
  isProfileCard: boolean = false;
  currentReciever: any;
  currentComponent: any;
  private componentSubscription: Subscription | null = null;
  private threadSubscription!: Subscription;
  private subscription!: Subscription;

  //Neue Logik ab hier:

  channelType: any;
  constructor(private route: ActivatedRoute) {}

  ngOnInit(): void {
    this.shareddata.dashboard = true;
    this.shareddata.login = false;

    this.route.queryParams.subscribe((params) => {
      console.log('Geladener Channel:', params['channeltype']);
    });

    this.componentSubscription = this.shareddata.component$.subscribe(
      (component) => {
        this.currentComponent = component;
        console.log('Aktuelle Komponente:', component);
      }
    );
    this.subscription = this.shareddata.openProfile$.subscribe(() => {
      this.openProfile();
    });

    this.threadSubscription = this.shareddata.threadToggle$.subscribe(() => {
      this.toggleThread();
    });
  }

  ngOnDestroy(): void {
    if (this.componentSubscription) {
      this.componentSubscription.unsubscribe();
    }
  }

  toggleThread() {
    this.drawer.toggle();
  }

  closeProfile() {
    this.isProfileCard = false;
  }

  openProfile() {
    this.currentReciever = this.shareddata.currentReciever;
    this.isProfileCard = !this.isProfileCard;
    console.log('OPEN');
    console.log(this.isProfileCard);
  }
}
