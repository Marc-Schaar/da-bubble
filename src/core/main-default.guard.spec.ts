import { TestBed } from '@angular/core/testing';
import { Router, UrlTree } from '@angular/router';
import { mainDefaultGuard } from './main-default.guard';

describe('mainDefaultGuard', () => {
  let routerSpy: jasmine.SpyObj<Router>;
  let originalInnerWidth: number;

  beforeEach(() => {
    originalInnerWidth = window.innerWidth;
    routerSpy = jasmine.createSpyObj<Router>('Router', ['parseUrl']);

    TestBed.configureTestingModule({
      providers: [{ provide: Router, useValue: routerSpy }],
    });
  });

  afterEach(() => {
    Object.defineProperty(window, 'innerWidth', { value: originalInnerWidth, configurable: true });
  });

  function setInnerWidth(width: number): void {
    Object.defineProperty(window, 'innerWidth', { value: width, configurable: true });
  }

  it('returns true when window.innerWidth < 1024 (mobile)', () => {
    setInnerWidth(500);

    const result = TestBed.runInInjectionContext(() => mainDefaultGuard({} as any, {} as any));

    expect(result).toBeTrue();
    expect(routerSpy.parseUrl).not.toHaveBeenCalled();
  });

  it('returns the parsed UrlTree for /main/new-message when window.innerWidth >= 1024 (desktop)', () => {
    setInnerWidth(1024);
    const fakeUrlTree = {} as UrlTree;
    routerSpy.parseUrl.and.returnValue(fakeUrlTree);

    const result = TestBed.runInInjectionContext(() => mainDefaultGuard({} as any, {} as any));

    expect(routerSpy.parseUrl).toHaveBeenCalledWith('/main/new-message');
    expect(result).toBe(fakeUrlTree);
  });

  it('treats a width just below the 1024 breakpoint as mobile', () => {
    setInnerWidth(1023);

    const result = TestBed.runInInjectionContext(() => mainDefaultGuard({} as any, {} as any));

    expect(result).toBeTrue();
  });

  it('treats a large desktop width as non-mobile', () => {
    setInnerWidth(1920);
    const fakeUrlTree = {} as UrlTree;
    routerSpy.parseUrl.and.returnValue(fakeUrlTree);

    const result = TestBed.runInInjectionContext(() => mainDefaultGuard({} as any, {} as any));

    expect(result).toBe(fakeUrlTree);
  });
});
