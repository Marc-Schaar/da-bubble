import { CommonModule } from '@angular/common';
import { Component, inject, OnDestroy, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';

import { HeaderComponent } from '../../../shared/components/header/header.component';
import { FireServiceService } from '../../../shared/services/firebase/fire-service.service';
import { SearchResultComponent } from '../../../shared/components/search-result/search-result.component';
import { NavigationService } from '../../../shared/services/navigation/navigation.service';
import { SearchService } from '../../../shared/services/search/search.service';
import { AddChannelComponent } from '../../app_channel/components/add-channel/add-channel.component';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-contactbar',
  standalone: true,
  imports: [CommonModule, HeaderComponent, MatIconModule, FormsModule, SearchResultComponent, RouterModule],
  templateUrl: './contactbar.component.html',
  styleUrl: './contactbar.component.scss',
})
export class ContactbarComponent implements OnInit, OnDestroy {
  public firestoreService = inject(FireServiceService);
  public navigationService: NavigationService = inject(NavigationService);
  public searchService: SearchService = inject(SearchService);
  private dialog: MatDialog = inject(MatDialog);
  public router: Router = inject(Router);

  public currentUser: any = [];
  public currentlist: any[] = [];
  public currentArray: any[] = [];
  isClicked = false;
  public input: string = '';
  public currentLink: string = '';
  public addChannelWindow: boolean = false;

  private unsubUsers?: any;
  private unsubChannels?: any;

  /**
   * Initializes the component by loading users, channels, and setting the current user.
   */
  async ngOnInit() {
    this.unsubUsers = this.firestoreService.subAllUsers();
    this.unsubChannels = this.firestoreService.subChannels();
  }

  public toggleDropdown(type: 'channels' | 'directMessages') {
    if (type === 'channels') {
      this.navigationService.isChannelsOpen.update((v) => !v);
    } else {
      this.navigationService.isDirectMessagesOpen.update((v) => !v);
    }
  }

  /**
   * Opens the dialog to add a new channel.
   */
  public openAddChannel() {
    const dialogRef = this.dialog.open(AddChannelComponent, {
      width: '872px',
      maxWidth: '95vw',
      height: 'auto',
      position: { top: '50%', left: '50%' },
      panelClass: 'fullscreen',
      data: {},
    });
  }

  ngOnDestroy() {
    if (this.unsubUsers) this.unsubUsers();
    if (this.unsubChannels) this.unsubChannels();
  }
}
