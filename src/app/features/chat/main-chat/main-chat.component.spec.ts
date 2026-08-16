import { Component } from '@angular/core';
import { ComponentFixture, fakeAsync, TestBed, tick } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideNoopAnimations } from '@angular/platform-browser/animations';

import { MainChatComponent } from './main-chat.component';
import { NavigationService } from '../../../shared/services/navigation/navigation.service';
import { SearchService } from '../../../shared/services/search/search.service';
import { AuthService } from '../../auth/services/auth/auth.service';
import { ContactbarComponent } from '../components/contactbar/contactbar.component';
import { ThreadComponent } from '../components/chat-thread/chat-thread.component';
import { HeaderSearchComponent } from '../../../shared/components/header-search/header-search.component';
import { HeaderUserMenuComponent } from '../../../shared/components/header-user-menu/header-user-menu.component';

import { mockSignal } from '../../../../testing/signal-service-mock.util';

// Lightweight stand-ins for the heavy nested feature components (each has its
// own full-depth spec elsewhere in this batch) so this spec can focus purely
// on MainChatComponent's own drawer/branch wiring.
@Component({ selector: 'app-contactbar', standalone: true, template: '' })
class StubContactbarComponent {}

@Component({ selector: 'app-thread', standalone: true, template: '' })
class StubThreadComponent {}

@Component({ selector: 'app-header-search', standalone: true, template: '' })
class StubHeaderSearchComponent {}

@Component({ selector: 'app-header-user-menu', standalone: true, template: '' })
class StubHeaderUserMenuComponent {}

describe('MainChatComponent', () => {
  let fixture: ComponentFixture<MainChatComponent>;
  let component: MainChatComponent;
  let navigationServiceSpy: any;
  let searchServiceSpy: jasmine.SpyObj<any>;

  beforeEach(async () => {
    navigationServiceSpy = {
      isMobile: mockSignal(false),
      isMainChat: mockSignal(true),
      isThreadOpen: mockSignal(false),
      toggleThread: jasmine.createSpy('toggleThread'),
    };
    searchServiceSpy = jasmine.createSpyObj('SearchService', ['resetList']);

    await TestBed.configureTestingModule({
      imports: [MainChatComponent],
      providers: [
        provideRouter([]),
        provideNoopAnimations(),
        { provide: NavigationService, useValue: navigationServiceSpy },
        { provide: SearchService, useValue: searchServiceSpy },
        { provide: AuthService, useValue: { currentUser: mockSignal(null) } },
      ],
    })
      .overrideComponent(MainChatComponent, {
        remove: { imports: [ContactbarComponent, ThreadComponent, HeaderSearchComponent, HeaderUserMenuComponent] },
        add: { imports: [StubContactbarComponent, StubThreadComponent, StubHeaderSearchComponent, StubHeaderUserMenuComponent] },
      })
      .compileComponents();

    fixture = TestBed.createComponent(MainChatComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('header (desktop only)', () => {
    it('renders app-header with search + user-menu slots on desktop', () => {
      navigationServiceSpy.isMobile.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-header')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-header-search')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('app-header-user-menu')).toBeTruthy();
    });

    it('hides app-header on mobile', () => {
      navigationServiceSpy.isMobile.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('app-header')).toBeFalsy();
    });
  });

  describe('contactbar drawer (desktop only)', () => {
    it('renders the side contactbar drawer, opened per barOpen(), on desktop', () => {
      navigationServiceSpy.isMobile.set(false);
      fixture.detectChanges();
      expect(component.drawerContactbar).toBeTruthy();
      expect(component.drawerContactbar.opened).toBe(true);
      expect(fixture.nativeElement.querySelector('.contactbar-container app-contactbar')).toBeTruthy();
    });

    it('does not render the side contactbar drawer on mobile', () => {
      navigationServiceSpy.isMobile.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.contactbar-container')).toBeFalsy();
    });

    it('toogleContactbar() toggles the drawer', () => {
      navigationServiceSpy.isMobile.set(false);
      fixture.detectChanges();
      spyOn(component.drawerContactbar, 'toggle');

      component.toogleContactbar();

      expect(component.drawerContactbar.toggle).toHaveBeenCalled();
    });

    it('keeps barOpen() in sync via (openedChange) once the real drawer finishes closing', fakeAsync(() => {
      navigationServiceSpy.isMobile.set(false);
      fixture.detectChanges();
      expect(component.barOpen()).toBe(true);

      // Drive it through the drawer's real close() (MatDrawer only emits
      // openedChange once its close animation/simulation completes, which is
      // itself scheduled via a couple of nested async EventEmitter timeouts).
      component.drawerContactbar.close();
      tick(500);

      expect(component.barOpen()).toBe(false);
    }));
  });

  describe('main content area branch', () => {
    it('desktop always renders the router-outlet regardless of isMainChat()', () => {
      navigationServiceSpy.isMobile.set(false);
      navigationServiceSpy.isMainChat.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('main router-outlet')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('main app-contactbar')).toBeFalsy();
    });

    it('mobile + isMainChat() shows the inline contactbar instead of the router-outlet', () => {
      navigationServiceSpy.isMobile.set(true);
      navigationServiceSpy.isMainChat.set(true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('main app-contactbar')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('main router-outlet')).toBeFalsy();
    });

    it('mobile + !isMainChat() shows the router-outlet instead of the contactbar', () => {
      navigationServiceSpy.isMobile.set(true);
      navigationServiceSpy.isMainChat.set(false);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('main router-outlet')).toBeTruthy();
      expect(fixture.nativeElement.querySelector('main app-contactbar')).toBeFalsy();
    });
  });

  describe('thread drawer bound to NavigationService.isThreadOpen()', () => {
    it('is closed by default', () => {
      fixture.detectChanges();
      expect(component.drawer.opened).toBe(false);
    });

    it('opens declaratively once isThreadOpen() becomes true (no effect() needed — see note below)', () => {
      fixture.detectChanges();
      navigationServiceSpy.isThreadOpen.set(true);
      fixture.detectChanges();
      expect(component.drawer.opened).toBe(true);
    });

    it('closes again once isThreadOpen() becomes false', () => {
      navigationServiceSpy.isThreadOpen.set(true);
      fixture.detectChanges();
      navigationServiceSpy.isThreadOpen.set(false);
      fixture.detectChanges();
      expect(component.drawer.opened).toBe(false);
    });

    it('calls navigationService.toggleThread("close") once the drawer finishes closing (closedStart)', fakeAsync(() => {
      navigationServiceSpy.isThreadOpen.set(true);
      fixture.detectChanges();
      tick();

      component.drawer.close();
      fixture.detectChanges();
      tick(500);

      expect(navigationServiceSpy.toggleThread).toHaveBeenCalledWith('close');
    }));

    it('uses "over" mode on mobile and "side" mode on desktop', () => {
      navigationServiceSpy.isMobile.set(true);
      fixture.detectChanges();
      expect(component.drawer.mode).toBe('over');

      navigationServiceSpy.isMobile.set(false);
      fixture.detectChanges();
      expect(component.drawer.mode).toBe('side');
    });
  });

  describe('closeAll()', () => {
    it('delegates to searchService.resetList()', () => {
      fixture.detectChanges();
      component.closeAll();
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    });

    it('is invoked when the main-chat-container is clicked', () => {
      fixture.detectChanges();
      const container: HTMLElement = fixture.nativeElement.querySelector('.main-chat-container');
      container.click();
      expect(searchServiceSpy.resetList).toHaveBeenCalled();
    });
  });
});
