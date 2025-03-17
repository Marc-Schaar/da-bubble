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
  shareddata = inject(UserService);
  router: Router = inject(Router);
  showFiller = true;
  isMobile: boolean = false;

  currentComponent: any;
  private componentSubscription: Subscription | null = null;
  private threadSubscription!: Subscription;
  private subscription!: Subscription;

  ngOnInit(): void {
    this.shareddata.dashboard = true;
    this.shareddata.login = false;
    this.getCurrentComponent();

    this.componentSubscription = this.shareddata.component$.subscribe(
      (component) => {
        this.currentComponent = component;
        console.log('Aktuelle Komponente:', component);
      }
    );

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

  getCurrentComponent() {
    console.log('müsste Component laden...');

    let storedComponent = localStorage.getItem('currentComponent');
    if (storedComponent) {
      this.currentComponent = JSON.parse(storedComponent);
    }
  }
}
