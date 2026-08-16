import { TestBed } from '@angular/core/testing';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { NavigationService } from './navigation.service';

describe('NavigationService', () => {
  let service: NavigationService;
  let routerSpy: jasmine.SpyObj<Router> & { events: Subject<any>; url: string };
  let originalInnerWidth: number;

  function setInnerWidth(width: number): void {
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  }

  function createService(initialUrl: string, initialWidth = 1200): void {
    routerSpy = jasmine.createSpyObj<Router>('Router', ['navigate']) as any;
    routerSpy.events = new Subject<any>();
    routerSpy.url = initialUrl;
    setInnerWidth(initialWidth);

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: routerSpy }],
    });
    service = TestBed.inject(NavigationService);
  }

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
  });

  afterEach(() => {
    setInnerWidth(originalInnerWidth);
  });

  describe('isMobile signal + resize handling', () => {
    it('initializes isMobile to true when window.innerWidth < 1024', () => {
      createService('/main', 500);
      expect(service.isMobile()).toBeTrue();
    });

    it('initializes isMobile to false when window.innerWidth >= 1024', () => {
      createService('/main', 1200);
      expect(service.isMobile()).toBeFalse();
    });

    it('updates isMobile to true on a resize event crossing below the 1024px breakpoint', () => {
      createService('/some/other/route', 1200);
      expect(service.isMobile()).toBeFalse();

      setInnerWidth(500);
      window.dispatchEvent(new Event('resize'));

      expect(service.isMobile()).toBeTrue();
    });

    it('updates isMobile to false on a resize event crossing above the 1024px breakpoint', () => {
      createService('/some/other/route', 500);
      expect(service.isMobile()).toBeTrue();

      setInnerWidth(1200);
      window.dispatchEvent(new Event('resize'));

      expect(service.isMobile()).toBeFalse();
    });

    it('navigates to /main/new-message when resize makes it non-mobile while router.url is exactly "/main"', () => {
      createService('/main', 500);
      routerSpy.url = '/main';

      setInnerWidth(1200);
      window.dispatchEvent(new Event('resize'));

      expect(routerSpy.navigate).toHaveBeenCalledWith(['/main/new-message']);
    });

    it('does not navigate on resize-to-desktop when router.url is not "/main"', () => {
      createService('/main/channel/abc', 500);
      routerSpy.url = '/main/channel/abc';
      routerSpy.navigate.calls.reset();

      setInnerWidth(1200);
      window.dispatchEvent(new Event('resize'));

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('does not navigate when a resize keeps isMobile the same value (distinctUntilChanged)', () => {
      createService('/main', 500);
      routerSpy.url = '/main';
      routerSpy.navigate.calls.reset();

      // still < 1024, isMobile stays true -> distinctUntilChanged suppresses the emission
      setInnerWidth(600);
      window.dispatchEvent(new Event('resize'));

      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });
  });

  describe('checkCurrentUrl (via constructor and NavigationEnd events)', () => {
    function navigateTo(url: string): void {
      routerSpy.events.next(new NavigationEnd(1, url, url));
    }

    beforeEach(() => {
      createService('/main', 1200);
    });

    it('opens channels list and closes DM list for a channel/ route', () => {
      navigateTo('/main/channel/abc123');
      expect(service.isChannelsOpen()).toBeTrue();
      expect(service.isDirectMessagesOpen()).toBeFalse();
    });

    it('opens DM list and closes channels list for a direct/ route', () => {
      navigateTo('/main/direct/xyz789');
      expect(service.isDirectMessagesOpen()).toBeTrue();
      expect(service.isChannelsOpen()).toBeFalse();
    });

    it('extracts the channel id and sets activeChatType to "channel"', () => {
      navigateTo('/main/channel/abc123');
      expect(service.activeChatType()).toBe('channel');
      expect(service.activeChatId()).toBe('abc123');
    });

    it('extracts the channel id and stops at a query string', () => {
      navigateTo('/main/channel/abc123?messageId=m1');
      expect(service.activeChatId()).toBe('abc123');
    });

    it('extracts the direct-message recipient id and sets activeChatType to "direct"', () => {
      navigateTo('/main/direct/xyz789');
      expect(service.activeChatType()).toBe('direct');
      expect(service.activeChatId()).toBe('xyz789');
    });

    it('sets activeChatType/activeChatId to null when the url matches neither channel/ nor direct/', () => {
      navigateTo('/main/new-message');
      expect(service.activeChatType()).toBeNull();
      expect(service.activeChatId()).toBeNull();
    });

    it('sets isThreadOpen true when the url contains messageId=', () => {
      navigateTo('/main/channel/abc?messageId=m1');
      expect(service.isThreadOpen()).toBeTrue();
    });

    it('sets isThreadOpen false when the url has no messageId=', () => {
      navigateTo('/main/channel/abc');
      expect(service.isThreadOpen()).toBeFalse();
    });

    it('flags isAuthPage for a login url', () => {
      navigateTo('/login');
      expect(service.isAuthPage()).toBeTrue();
      expect(service.isSignUpPage()).toBeFalse();
    });

    it('flags isAuthPage and isSignUpPage for a register url', () => {
      navigateTo('/register');
      expect(service.isAuthPage()).toBeTrue();
      expect(service.isSignUpPage()).toBeTrue();
    });

    it('flags isContactbarPage for a url containing "contactbar"', () => {
      navigateTo('/main/contactbar');
      expect(service.isContactbarPage()).toBeTrue();
    });

    it('does not flag isContactbarPage for an unrelated url', () => {
      navigateTo('/main/channel/abc');
      expect(service.isContactbarPage()).toBeFalse();
    });

    it('flags isMainChat for the exact path "/main"', () => {
      navigateTo('/main');
      expect(service.isMainChat()).toBeTrue();
    });

    it('flags isMainChat for the exact path "/main/"', () => {
      navigateTo('/main/');
      expect(service.isMainChat()).toBeTrue();
    });

    it('does not flag isMainChat for a deeper path like "/main/channel/abc"', () => {
      navigateTo('/main/channel/abc');
      expect(service.isMainChat()).toBeFalse();
    });

    it('ignores the query string when determining isMainChat', () => {
      navigateTo('/main?foo=bar');
      expect(service.isMainChat()).toBeTrue();
    });

    it('flags isLegal for a "Dataprotection" url', () => {
      navigateTo('/Dataprotection');
      expect(service.isLegal()).toBeTrue();
    });

    it('flags isLegal for an "imprint" url', () => {
      navigateTo('/imprint');
      expect(service.isLegal()).toBeTrue();
    });

    it('does not flag isLegal for an unrelated url', () => {
      navigateTo('/main');
      expect(service.isLegal()).toBeFalse();
    });

    it('flags isPasswordPage for a "forgot-password" url', () => {
      navigateTo('/forgot-password');
      expect(service.isPasswordPage()).toBeTrue();
    });

    it('flags isPasswordPage for a "reset-password" url', () => {
      navigateTo('/reset-password');
      expect(service.isPasswordPage()).toBeTrue();
    });

    it('does not flag isPasswordPage for an unrelated url', () => {
      navigateTo('/main');
      expect(service.isPasswordPage()).toBeFalse();
    });

    it('runs checkCurrentUrl once at construction time using router.url', () => {
      TestBed.resetTestingModule();
      createService('/main/channel/initial-id', 1200);
      expect(service.activeChatType()).toBe('channel');
      expect(service.activeChatId()).toBe('initial-id');
    });
  });

  describe('navigation methods', () => {
    beforeEach(() => {
      createService('/main', 1200);
      routerSpy.navigate.calls.reset();
    });

    it('gotToAvatarSelection navigates to register/avatar', () => {
      service.gotToAvatarSelection();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['register/avatar']);
    });

    it('goToLogin navigates to login', () => {
      service.goToLogin();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['login']);
    });

    it('goToNewMessage navigates to /main/new-message', () => {
      service.goToNewMessage();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/main/new-message']);
    });

    it('goBackToList delegates to goToNewMessage', () => {
      service.goBackToList();
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/main/new-message']);
    });

    it('gotToChat navigates to /main only, when on mobile', () => {
      service.isMobile.set(true);
      service.gotToChat();
      expect(routerSpy.navigate).toHaveBeenCalledTimes(1);
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/main']);
    });

    it('gotToChat double-navigates to /main then /main/new-message, when on desktop', () => {
      service.isMobile.set(false);
      service.gotToChat();
      expect(routerSpy.navigate).toHaveBeenCalledTimes(2);
      expect(routerSpy.navigate.calls.argsFor(0)).toEqual([['/main']]);
      expect(routerSpy.navigate.calls.argsFor(1)).toEqual([['/main/new-message']]);
    });

    it('goToThread opens the thread and merges messageId/receiverId query params', () => {
      service.isThreadOpen.set(false);
      service.goToThread('msg1', 'chan1');

      expect(service.isThreadOpen()).toBeTrue();
      expect(routerSpy.navigate).toHaveBeenCalledWith([], {
        queryParams: { messageId: 'msg1', receiverId: 'chan1' },
        queryParamsHandling: 'merge',
      });
    });

    it('selectChannel closes the thread, sets active channel state and navigates', () => {
      service.isThreadOpen.set(true);
      service.selectChannel('chan42');

      expect(service.isThreadOpen()).toBeFalse();
      expect(service.activeChatType()).toBe('channel');
      expect(service.activeChatId()).toBe('chan42');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/main/channel', 'chan42']);
    });

    it('selectDirectMessageRecipient closes the thread, sets active DM state and navigates', () => {
      service.isThreadOpen.set(true);
      service.selectDirectMessageRecipient('user42');

      expect(service.isThreadOpen()).toBeFalse();
      expect(service.activeChatType()).toBe('direct');
      expect(service.activeChatId()).toBe('user42');
      expect(routerSpy.navigate).toHaveBeenCalledWith(['/main/direct', 'user42']);
    });

    it('toggleThread("open") sets isThreadOpen true without navigating', () => {
      service.isThreadOpen.set(false);
      service.toggleThread('open');

      expect(service.isThreadOpen()).toBeTrue();
      expect(routerSpy.navigate).not.toHaveBeenCalled();
    });

    it('toggleThread("close") sets isThreadOpen false and clears the messageId query param', () => {
      service.isThreadOpen.set(true);
      service.toggleThread('close');

      expect(service.isThreadOpen()).toBeFalse();
      expect(routerSpy.navigate).toHaveBeenCalledWith([], {
        queryParams: { messageId: null },
        queryParamsHandling: 'merge',
      });
    });
  });
});
