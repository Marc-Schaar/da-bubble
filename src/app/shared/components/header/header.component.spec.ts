import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { HeaderComponent } from './header.component';
import { AuthService } from '../../../features/auth/services/auth/auth.service';
import { makeUser } from '../../../../testing/user-fixtures';
import { mockSignal } from '../../../../testing/signal-service-mock.util';

@Component({
  standalone: true,
  imports: [HeaderComponent],
  template: `
    <app-header>
      <span headerSearch>search-slot</span>
      <span headerActions>actions-slot</span>
    </app-header>
  `,
})
class HostComponent {}

describe('HeaderComponent', () => {
  let fixture: ComponentFixture<HeaderComponent>;
  let component: HeaderComponent;
  let authServiceSpy: { currentUser: ReturnType<typeof mockSignal> };

  function setup() {
    fixture = TestBed.createComponent(HeaderComponent);
    component = fixture.componentInstance;
  }

  beforeEach(async () => {
    authServiceSpy = { currentUser: mockSignal<ReturnType<typeof makeUser> | null>(null) };

    await TestBed.configureTestingModule({
      imports: [HeaderComponent],
      providers: [provideRouter([]), { provide: AuthService, useValue: authServiceSpy }],
    }).compileComponents();
  });

  it('creates', () => {
    setup();
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('logo routerLink', () => {
    it('points to /login when there is no current user', () => {
      setup();
      fixture.detectChanges();
      const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.logo');
      expect(link.getAttribute('href')).toBe('/login');
    });

    it('points to /main when there is a current user', () => {
      authServiceSpy.currentUser.set(makeUser());
      setup();
      fixture.detectChanges();
      const link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.logo');
      expect(link.getAttribute('href')).toBe('/main');
    });

    it('re-evaluates the link once the current user changes', () => {
      setup();
      fixture.detectChanges();
      let link: HTMLAnchorElement = fixture.nativeElement.querySelector('a.logo');
      expect(link.getAttribute('href')).toBe('/login');

      authServiceSpy.currentUser.set(makeUser());
      fixture.detectChanges();
      link = fixture.nativeElement.querySelector('a.logo');
      expect(link.getAttribute('href')).toBe('/main');
    });
  });

  describe('content projection', () => {
    let hostFixture: ComponentFixture<HostComponent>;

    beforeEach(() => {
      hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
    });

    it('projects headerSearch content into the searchbar slot', () => {
      const searchbar: HTMLElement = hostFixture.nativeElement.querySelector('.searchbar');
      expect(searchbar.textContent).toContain('search-slot');
    });

    it('projects headerActions content into the user-menu slot', () => {
      const userMenu: HTMLElement = hostFixture.nativeElement.querySelector('.user-menu');
      expect(userMenu.textContent).toContain('actions-slot');
    });
  });
});
