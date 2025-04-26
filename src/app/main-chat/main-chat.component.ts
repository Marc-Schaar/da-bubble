import { Component, inject, ViewChild, OnInit, ChangeDetectorRef, ElementRef } from '@angular/core';
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
import { NavigationService } from '../service/navigation/navigation.service';
import { Router } from '@angular/router';

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
  @ViewChild('drawerContactbar') drawerContactbar!: MatDrawer;
  @ViewChild('feedback') feedbackRef!: ElementRef<HTMLDivElement>;

  shareddata = inject(UserService);
  fireService: FireServiceService = inject(FireServiceService);
  router: Router = inject(Router);

  feedbackVisible: boolean = false;
  showFiller = true;
  isMobile: boolean = false;
  isProfileCard: boolean = false;
  barOpen: boolean = false;
  isChatOverlayVisible = false;
  currentReciever: any;
  componentSubscription: Subscription | null = null;
  private threadSubscription!: Subscription;
  private overlaySubscription: Subscription | null = null;
  private contactbarSubscription!: Subscription;
  private subscription!: Subscription;

  private subscriptions: Subscription[] = [];
  //Neue Logik ab hier:
  channelType: string = 'default';
  channelMessages: any = [];
  docId: string = '';

  //Cleancode Servives update
  navigationService: NavigationService = inject(NavigationService);

  constructor(private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.shareddata.dashboard = true;
    this.shareddata.login = false;

    this.subscriptions.push(
      this.navigationService.component$.subscribe(() => {
        if (this.navigationService.channelType === 'direct') {
          this.shareddata.toggleThread('close');
        }
        this.cdr.detectChanges();
      })
    );
    this.subscriptions.push(this.shareddata.showFeedback$.subscribe((msg) => this.showFeedback(msg)));
    this.subscriptions.push(this.shareddata.threadToggle$.subscribe((val) => (val === 'open' ? this.drawer.open() : this.drawer.close())));
    this.subscriptions.push(this.shareddata.contactbarSubscription$.subscribe(() => this.drawerContactbar.toggle()));
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  closeProfile() {
    this.isProfileCard = false;
  }

  showFeedback(message: string) {
    this.feedbackVisible = true;
    setTimeout(() => {
      if (this.feedbackRef) {
        this.feedbackRef.nativeElement.textContent = message;
      }
    });
    setTimeout(() => {
      this.feedbackVisible = false;
    }, 1000);
  }

  toogleContactbar() {
    this.drawerContactbar.toggle();
    //this.shareddata.toggleContactbar()
  }

  toggleWorkspaceMenu() {
    this.barOpen = !this.barOpen;
  }
}
