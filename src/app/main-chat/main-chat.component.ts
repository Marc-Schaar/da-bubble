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
  ],
  templateUrl: './main-chat.component.html',
  styleUrl: './main-chat.component.scss',
})
export class MainChatComponent implements OnInit {
  @ViewChild('drawer') drawer!: MatDrawer;
  shareddata = inject(UserService);
  showFiller = true;
  currentComponent: any;
  private componentSubscription: Subscription | null = null;
  private threadSubscription!: Subscription;

  ngOnInit(): void {
    this.shareddata.dashboard = true;
    this.shareddata.login = false;
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
}
