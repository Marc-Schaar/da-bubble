import { TestBed } from '@angular/core/testing';
import { PLATFORM_ID } from '@angular/core';
import { provideRouter } from '@angular/router';
import * as AOS from 'aos';
import { AppComponent } from './app.component';

describe('AppComponent', () => {
  afterEach(() => {
    // Guard against test pollution: restore matchMedia if a test replaced it.
    delete (window as any).matchMedia;
  });

  function configure(platformId: string): void {
    TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([]), { provide: PLATFORM_ID, useValue: platformId }],
    });
  }

  it('sets the title', () => {
    configure('browser');
    spyOn(AOS, 'init');
    (window as any).matchMedia = jasmine.createSpy('matchMedia').and.returnValue({ matches: false });
    const fixture = TestBed.createComponent(AppComponent);
    expect(fixture.componentInstance.title).toBe('DaBubble');
  });

  describe('on the browser platform', () => {
    beforeEach(() => {
      configure('browser');
    });

    it('calls AOS.init on ngOnInit', () => {
      spyOn(AOS, 'init');
      (window as any).matchMedia = jasmine.createSpy('matchMedia').and.returnValue({ matches: false });

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      expect(AOS.init).toHaveBeenCalledTimes(1);
      expect(AOS.init).toHaveBeenCalledWith(jasmine.objectContaining({ disable: jasmine.any(Function) }));
    });

    it('passes a disable() callback that reflects matchMedia("(prefers-reduced-motion: reduce)").matches === true', () => {
      spyOn(AOS, 'init');
      const matchMediaSpy = jasmine.createSpy('matchMedia').and.returnValue({ matches: true });
      (window as any).matchMedia = matchMediaSpy;

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      const options = (AOS.init as jasmine.Spy).calls.mostRecent().args[0];
      expect(options.disable()).toBeTrue();
      expect(matchMediaSpy).toHaveBeenCalledWith('(prefers-reduced-motion: reduce)');
    });

    it('passes a disable() callback that reflects matchMedia(...).matches === false', () => {
      spyOn(AOS, 'init');
      (window as any).matchMedia = jasmine.createSpy('matchMedia').and.returnValue({ matches: false });

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      const options = (AOS.init as jasmine.Spy).calls.mostRecent().args[0];
      expect(options.disable()).toBeFalse();
    });
  });

  describe('on the server platform', () => {
    beforeEach(() => {
      configure('server');
    });

    it('does not call AOS.init', () => {
      spyOn(AOS, 'init');

      const fixture = TestBed.createComponent(AppComponent);
      fixture.detectChanges();

      expect(AOS.init).not.toHaveBeenCalled();
    });
  });
});
