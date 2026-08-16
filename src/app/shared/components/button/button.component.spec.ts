import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';

import { ButtonComponent } from './button.component';

@Component({
  standalone: true,
  imports: [ButtonComponent],
  template: `<app-button
    [variant]="variant"
    [type]="type"
    [disabled]="disabled"
    [loading]="loading"
    [ariaLabel]="ariaLabel"
    [ariaPressed]="ariaPressed"
    [ariaExpanded]="ariaExpanded"
    [ariaHaspopup]="ariaHaspopup"
    [ariaDisabled]="ariaDisabled"
    [form]="form"
    (click)="onClick()"
    >Label</app-button
  >`,
})
class HostComponent {
  variant: 'primary' | 'secondary' | 'icon' | 'plain' = 'primary';
  type: 'button' | 'submit' = 'button';
  disabled = false;
  loading = false;
  ariaLabel: string | null = null;
  ariaPressed: boolean | null = null;
  ariaExpanded: boolean | null = null;
  ariaHaspopup: string | null = null;
  ariaDisabled = false;
  form: string | null = null;
  clicked = 0;

  onClick(): void {
    this.clicked++;
  }
}

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
  });

  function nativeButton(f: ComponentFixture<any> = fixture): HTMLButtonElement {
    return f.nativeElement.querySelector('button');
  }

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  describe('variant classes on host', () => {
    it('defaults to primary', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.classList.contains('app-button--primary')).toBe(true);
      expect(fixture.nativeElement.classList.contains('app-button--secondary')).toBe(false);
      expect(fixture.nativeElement.classList.contains('app-button--icon')).toBe(false);
      expect(fixture.nativeElement.classList.contains('app-button--plain')).toBe(false);
    });

    for (const variant of ['secondary', 'icon', 'plain'] as const) {
      it(`applies app-button--${variant} for variant="${variant}"`, () => {
        fixture.componentRef.setInput('variant', variant);
        fixture.detectChanges();
        expect(fixture.nativeElement.classList.contains(`app-button--${variant}`)).toBe(true);
        expect(fixture.nativeElement.classList.contains('app-button--primary')).toBe(false);
      });
    }
  });

  describe('type passthrough', () => {
    it('defaults the native button type to "button"', () => {
      fixture.detectChanges();
      expect(nativeButton().type).toBe('button');
    });

    it('passes through type="submit"', () => {
      fixture.componentRef.setInput('type', 'submit');
      fixture.detectChanges();
      expect(nativeButton().type).toBe('submit');
    });
  });

  describe('disabled / loading', () => {
    it('is not disabled by default', () => {
      fixture.detectChanges();
      expect(nativeButton().disabled).toBe(false);
    });

    it('disables the native button when disabled=true', () => {
      fixture.componentRef.setInput('disabled', true);
      fixture.detectChanges();
      expect(nativeButton().disabled).toBe(true);
    });

    it('disables the native button when loading=true even if disabled=false', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      expect(nativeButton().disabled).toBe(true);
    });

    it('renders a spinner and hides content while loading', () => {
      fixture.componentRef.setInput('loading', true);
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.spinner')).toBeTruthy();
      const content = fixture.nativeElement.querySelector('.content');
      expect(content.classList.contains('content--hidden')).toBe(true);
      expect(nativeButton().getAttribute('aria-busy')).toBe('true');
    });

    it('renders no spinner and visible content while not loading', () => {
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('.spinner')).toBeFalsy();
      const content = fixture.nativeElement.querySelector('.content');
      expect(content.classList.contains('content--hidden')).toBe(false);
      expect(nativeButton().getAttribute('aria-busy')).toBe('false');
    });

    it('coerces disabled/loading string attributes via booleanAttribute transform', () => {
      // booleanAttribute treats the presence of any non-'false' string as true.
      fixture.componentRef.setInput('disabled', 'true' as any);
      fixture.detectChanges();
      expect(nativeButton().disabled).toBe(true);
    });
  });

  describe('aria / form attribute passthrough', () => {
    it('leaves aria-label/aria-pressed/aria-expanded/aria-haspopup/form absent by default', () => {
      fixture.detectChanges();
      const btn = nativeButton();
      expect(btn.hasAttribute('aria-label')).toBe(false);
      expect(btn.hasAttribute('aria-pressed')).toBe(false);
      expect(btn.hasAttribute('aria-expanded')).toBe(false);
      expect(btn.hasAttribute('aria-haspopup')).toBe(false);
      expect(btn.hasAttribute('form')).toBe(false);
    });

    it('passes through ariaLabel, ariaPressed, ariaExpanded, ariaHaspopup, form', () => {
      fixture.componentRef.setInput('ariaLabel', 'Close dialog');
      fixture.componentRef.setInput('ariaPressed', true);
      fixture.componentRef.setInput('ariaExpanded', false);
      fixture.componentRef.setInput('ariaHaspopup', 'menu');
      fixture.componentRef.setInput('form', 'my-form');
      fixture.detectChanges();

      const btn = nativeButton();
      expect(btn.getAttribute('aria-label')).toBe('Close dialog');
      expect(btn.getAttribute('aria-pressed')).toBe('true');
      expect(btn.getAttribute('aria-expanded')).toBe('false');
      expect(btn.getAttribute('aria-haspopup')).toBe('menu');
      expect(btn.getAttribute('form')).toBe('my-form');
    });
  });

  describe('ariaDisabled', () => {
    it('sets aria-disabled="true" and the host class when ariaDisabled=true', () => {
      fixture.componentRef.setInput('ariaDisabled', true);
      fixture.detectChanges();
      expect(nativeButton().getAttribute('aria-disabled')).toBe('true');
      expect(fixture.nativeElement.classList.contains('app-button--aria-disabled')).toBe(true);
    });

    it('leaves aria-disabled absent when ariaDisabled=false', () => {
      fixture.detectChanges();
      expect(nativeButton().hasAttribute('aria-disabled')).toBe(false);
      expect(fixture.nativeElement.classList.contains('app-button--aria-disabled')).toBe(false);
    });

    it('does not set the native disabled attribute, only aria-disabled (button stays focusable)', () => {
      fixture.componentRef.setInput('ariaDisabled', true);
      fixture.detectChanges();
      expect(nativeButton().disabled).toBe(false);
    });
  });

  describe('content projection', () => {
    it('renders projected content unchanged (via host wrapper, since app-button has no content when created directly)', async () => {
      const hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
      expect(hostFixture.nativeElement.querySelector('.content').textContent.trim()).toBe('Label');
    });
  });
});

// This describe is intentionally NOT nested inside the ButtonComponent describe above: TestBed
// forbids calling configureTestingModule again after a component from a previous configuration has
// already been created, so a beforeEach here must start from a fresh (non-instantiated) TestBed.
describe('ButtonComponent click behavior (via host wrapper)', () => {
  let hostFixture: ComponentFixture<HostComponent>;
  let host: HostComponent;

  function nativeButton(f: ComponentFixture<any>): HTMLButtonElement {
    return f.nativeElement.querySelector('button');
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    hostFixture = TestBed.createComponent(HostComponent);
    host = hostFixture.componentInstance;
    hostFixture.detectChanges();
  });

  it('fires the outer (click) handler on a normal click', () => {
    nativeButton(hostFixture).click();
    expect(host.clicked).toBe(1);
  });

  it('does not fire the outer (click) handler when disabled (native browser behavior)', () => {
    host.disabled = true;
    hostFixture.detectChanges();
    nativeButton(hostFixture).click();
    expect(host.clicked).toBe(0);
  });

  it('does not fire the outer (click) handler when loading (native disabled)', () => {
    host.loading = true;
    hostFixture.detectChanges();
    nativeButton(hostFixture).click();
    expect(host.clicked).toBe(0);
  });

  it('stops propagation and does not fire the outer (click) handler when ariaDisabled=true', () => {
    host.ariaDisabled = true;
    hostFixture.detectChanges();
    nativeButton(hostFixture).click();
    expect(host.clicked).toBe(0);
  });

  it('fires normally when ariaDisabled=false', () => {
    host.ariaDisabled = false;
    hostFixture.detectChanges();
    nativeButton(hostFixture).click();
    expect(host.clicked).toBe(1);
  });
});
