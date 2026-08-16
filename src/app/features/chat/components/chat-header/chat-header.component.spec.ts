import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatBottomSheet } from '@angular/material/bottom-sheet';

import { ChatHeaderComponent } from './chat-header.component';
import { NavigationService } from '../../../../shared/services/navigation/navigation.service';
import { AuthService } from '../../../auth/services/auth/auth.service';
import { UserMenuComponent } from '../../../../shared/components/user-menu/user-menu.component';

import { makeUser } from '../../../../../testing/user-fixtures';
import { mockSignal } from '../../../../../testing/signal-service-mock.util';

describe('ChatHeaderComponent', () => {
  let fixture: ComponentFixture<ChatHeaderComponent>;
  let component: ChatHeaderComponent;
  let navigationServiceSpy: jasmine.SpyObj<NavigationService>;
  let authServiceSpy: any;
  let bottomSheetSpy: jasmine.SpyObj<any>;

  const currentUser = makeUser();

  beforeEach(async () => {
    navigationServiceSpy = jasmine.createSpyObj<NavigationService>('NavigationService', ['toggleThread', 'gotToChat']);
    authServiceSpy = { currentUser: mockSignal(currentUser) };
    bottomSheetSpy = jasmine.createSpyObj('MatBottomSheet', ['open']);

    await TestBed.configureTestingModule({
      imports: [ChatHeaderComponent],
      providers: [
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: AuthService, useValue: authServiceSpy },
        { provide: MatBottomSheet, useValue: bottomSheetSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ChatHeaderComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders the current user\'s photo and display name on the menu button', () => {
    fixture.detectChanges();
    // The first <img> is the fixed workspace logo next to the back button;
    // the user's photo is the second one, on the menu-open button.
    const images: HTMLImageElement[] = fixture.nativeElement.querySelectorAll('img');
    const img = images[1];
    expect(img.src).toContain(currentUser.photoUrl);
    expect(img.alt).toBe(currentUser.displayName);
  });

  describe('handleBack', () => {
    it('closes the thread drawer when isThread=true', () => {
      fixture.componentRef.setInput('isThread', true);
      fixture.detectChanges();
      component.handleBack();
      expect(navigationServiceSpy.toggleThread).toHaveBeenCalledWith('close');
      expect(navigationServiceSpy.gotToChat).not.toHaveBeenCalled();
    });

    it('navigates back to chat when isThread=false', () => {
      fixture.componentRef.setInput('isThread', false);
      fixture.detectChanges();
      component.handleBack();
      expect(navigationServiceSpy.gotToChat).toHaveBeenCalled();
      expect(navigationServiceSpy.toggleThread).not.toHaveBeenCalled();
    });

    it('defaults isThread to false', () => {
      fixture.detectChanges();
      component.handleBack();
      expect(navigationServiceSpy.gotToChat).toHaveBeenCalled();
    });

    it('wires the back button click to handleBack()', () => {
      fixture.componentRef.setInput('isThread', true);
      fixture.detectChanges();
      const backBtn: HTMLButtonElement = fixture.nativeElement.querySelector('button');
      backBtn.click();
      expect(navigationServiceSpy.toggleThread).toHaveBeenCalledWith('close');
    });
  });

  describe('openUserMenu', () => {
    it('opens the user menu as a bottom sheet', () => {
      fixture.detectChanges();
      component.openUserMenu();
      expect(bottomSheetSpy.open).toHaveBeenCalledWith(UserMenuComponent);
    });

    it('wires the menu button click to openUserMenu()', () => {
      fixture.detectChanges();
      const buttons: HTMLButtonElement[] = Array.from(fixture.nativeElement.querySelectorAll('button'));
      buttons[1].click();
      expect(bottomSheetSpy.open).toHaveBeenCalledWith(UserMenuComponent);
    });
  });
});
