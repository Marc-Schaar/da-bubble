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
export class MainChatComponent {
  @ViewChild('drawer') drawer!: MatDrawer;
  @ViewChild('drawerContactbar') drawerContactbar!: MatDrawer;
  @ViewChild('feedback') feedbackRef!: ElementRef<HTMLDivElement>;
  public readonly navigationService: NavigationService = inject(NavigationService);
  private searchService: SearchService = inject(SearchService);

  public feedbackVisible: boolean = false;
  public barOpen = signal<boolean>(true);
  public isChatOverlayVisible: boolean = false;

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
    if (this.drawerContactbar) {
      this.drawerContactbar.toggle();
      this.barOpen.set(this.drawerContactbar.opened);
    }
  }

  public closeAll() {
    this.searchService.resetList();
  }
}
