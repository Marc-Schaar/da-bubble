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
import { AuthService } from '../service/auth/auth.service';

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
  feedbackVisible: boolean = false;
  showFiller = true;
  isMobile: boolean = false;
  isProfileCard: boolean = false;
  barOpen: boolean = false;
  isChatOverlayVisible = false;
  currentReciever: any;
  //Neue Logik ab hier:
  channelType: string = 'default';
  channelMessages: any = [];
  //Cleancode Servives update
  fireService: FireServiceService = inject(FireServiceService);
  router: Router = inject(Router);
  navigationService: NavigationService = inject(NavigationService);
  authService = inject(AuthService);
  private subscriptions: Subscription[] = [];

  /**
   * Constructor for SomeComponent. Initializes the component with the ChangeDetectorRef service to manually trigger change detection.
   *
   * @param cdr - ChangeDetectorRef service instance used to manually trigger change detection in the component.
   */
  constructor(private cdr: ChangeDetectorRef) {}

  /**
   * Lifecycle hook that is called when the component is initialized.
   * Sets the dashboard and login properties of the shared service and subscribes to various observables.
   */
  ngOnInit(): void {
    this.navigationService.initialize();
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

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Unsubscribes from all active subscriptions.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  /**
   * Closes the profile card.
   */
  closeProfile() {
    this.isProfileCard = false;
  }

  /**
   * Displays a feedback message for a brief period.
   * @param message - The message to display.
   */
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

  /**
   * Toggles the visibility of the contact bar.
   */
  toogleContactbar() {
    this.drawerContactbar.toggle();
  }

  /**
   * Toggles the workspace menu.
   */
  toggleWorkspaceMenu() {
    this.barOpen = !this.barOpen;
  }
}
