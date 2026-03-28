import { Component, inject, ViewChild, OnInit, ChangeDetectorRef, ElementRef, AfterViewInit, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDividerModule } from '@angular/material/divider';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDrawer, MatSidenavModule } from '@angular/material/sidenav';
import { ContactbarComponent } from '../contactbar/contactbar.component';
import { filter, Subscription } from 'rxjs';

import { ThreadComponent } from '../chat-thread/chat-thread.component';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { UserService } from '../../../shared/services/user/shared.service';
import { NavigationService } from '../../../shared/services/navigation/navigation.service';
import { SearchService } from '../../../shared/services/search/search.service';

import { BreakpointObserver } from '@angular/cdk/layout';
import { NavigationEnd, Router, RouterModule } from '@angular/router';

@Component({
  selector: 'app-main-chat',
  imports: [
    MatIconModule,
    MatButtonModule,
    MatDividerModule,
    CommonModule,
    FormsModule,
    MatSidenavModule,
    ThreadComponent,
    RouterModule,
    HeaderComponent,
    ContactbarComponent,
  ],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss',
})
export class MainChatComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatDrawer;
  @ViewChild('drawerContactbar') drawerContactbar!: MatDrawer;
  @ViewChild('feedback') feedbackRef!: ElementRef<HTMLDivElement>;
  public readonly navigationService: NavigationService = inject(NavigationService);
  private subscriptions: Subscription[] = [];
  private searchService: SearchService = inject(SearchService);
  public feedbackVisible: boolean = false;
  public barOpen: boolean = true;
  public isChatOverlayVisible: boolean = false;

  // Signal, das prüft, ob wir auf Mobile sind (< 768px)

  // State, ob gerade ein Channel/Chat aktiv ist
  showContent = signal(false);
  private router = inject(Router);

  constructor() {}

  /**
   * Lifecycle hook that is called when the component is initialized.
   * Sets the dashboard and login properties of the shared service and subscribes to various observables.
   */
  ngOnInit(): void {
    this.updateContentState(this.router.url);

    this.subscriptions.push(
      this.router.events.pipe(filter((e) => e instanceof NavigationEnd)).subscribe((event: any) => {
        this.updateContentState(event.urlAfterRedirects);
      }),
    );
  }

  private updateContentState(url: string) {
    const hasContent = url.includes('channel/') || url.includes('direct/') || url.includes('new-message');

    if (this.navigationService.isMobile() && url.endsWith('/main')) {
      this.showContent.set(false);
    } else if (this.navigationService.isMobile() && hasContent) {
      this.showContent.set(true);
    } else {
      this.showContent.set(false);
    }
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

  public closeAll() {
    this.searchService.resetList();
  }
}
