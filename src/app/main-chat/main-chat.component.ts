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
import { NavigationService } from '../service/navigation/navigation.service';

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

  public readonly navigationService: NavigationService = inject(NavigationService);
  private readonly userService = inject(UserService);
  private cdr: ChangeDetectorRef = inject(ChangeDetectorRef);
  private subscriptions: Subscription[] = [];

  public feedbackVisible: boolean = false;
  public barOpen: boolean = false;
  public isChatOverlayVisible: boolean = false;

  constructor() {}

  /**
   * Lifecycle hook that is called when the component is initialized.
   * Sets the dashboard and login properties of the shared service and subscribes to various observables.
   */
  ngOnInit(): void {
    if (!this.navigationService.isInitialize) {
      this.navigationService.initialize();
    }

    this.userService.dashboard = true;
    this.userService.login = false;
    this.subscriptions.push(
      this.navigationService.component$.subscribe(() => {
        if (this.navigationService.channelType === 'direct') {
          this.userService.toggleThread('close');
        }
        this.cdr.detectChanges();
      })
    );
    this.subscriptions.push(this.userService.showFeedback$.subscribe((msg) => this.showFeedback(msg)));
    this.subscriptions.push(this.userService.threadToggle$.subscribe((val) => (val === 'open' ? this.drawer.open() : this.drawer.close())));
    this.subscriptions.push(this.userService.contactbarSubscription$.subscribe(() => this.drawerContactbar.toggle()));
  }

  /**
   * Lifecycle hook that is called when the component is destroyed.
   * Unsubscribes from all active subscriptions.
   */
  ngOnDestroy(): void {
    this.subscriptions.forEach((s) => s.unsubscribe());
  }

  /**
   * Displays a feedback message for a brief period.
   * @param message - The message to display.
   */
  public showFeedback(message: string) {
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
  public toogleContactbar() {
    this.drawerContactbar.toggle();
    this.barOpen = !this.barOpen;
  }
}
