import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GuestLockTooltipComponent } from './guest-lock-tooltip.component';
import { AuthService } from '../../../features/auth/services/auth/auth.service';

@Component({
  standalone: true,
  imports: [GuestLockTooltipComponent],
  template: `<app-guest-lock-tooltip [mobilePosition]="mobilePosition">
    <button type="button">Trigger 1</button>
    <button type="button">Trigger 2</button>
  </app-guest-lock-tooltip>`,
})
class HostComponent {
  mobilePosition = false;
}

describe('GuestLockTooltipComponent', () => {
  function configure(isGuest: boolean) {
    return TestBed.configureTestingModule({
      imports: [GuestLockTooltipComponent],
      providers: [{ provide: AuthService, useValue: { isGuest: () => isGuest } }],
    }).compileComponents();
  }

  it('creates', async () => {
    await configure(false);
    const fixture = TestBed.createComponent(GuestLockTooltipComponent);
    fixture.detectChanges();
    expect(fixture.componentInstance).toBeTruthy();
  });

  it('does not apply guest-locked class when the user is not a guest', async () => {
    await configure(false);
    const fixture = TestBed.createComponent(GuestLockTooltipComponent);
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.tooltip-cont');
    expect(wrapper.classList.contains('guest-locked')).toBe(false);
  });

  it('applies guest-locked class when the user is a guest', async () => {
    await configure(true);
    const fixture = TestBed.createComponent(GuestLockTooltipComponent);
    fixture.detectChanges();
    const wrapper = fixture.nativeElement.querySelector('.tooltip-cont');
    expect(wrapper.classList.contains('guest-locked')).toBe(true);
  });

  it('renders the tooltip text "Zugang für Gäste gesperrt"', async () => {
    await configure(false);
    const fixture = TestBed.createComponent(GuestLockTooltipComponent);
    fixture.detectChanges();
    const tooltip = fixture.nativeElement.querySelector('.tooltip');
    expect(tooltip?.textContent.trim()).toBe('Zugang für Gäste gesperrt');
    expect(tooltip?.getAttribute('role')).toBe('tooltip');
  });

  it('does not apply the guest-msg-pos class by default (mobilePosition=false)', async () => {
    await configure(false);
    const fixture = TestBed.createComponent(GuestLockTooltipComponent);
    fixture.detectChanges();
    const tooltip = fixture.nativeElement.querySelector('.tooltip');
    expect(tooltip.classList.contains('guest-msg-pos')).toBe(false);
  });

  it('applies the guest-msg-pos class when mobilePosition=true', async () => {
    await configure(false);
    const fixture = TestBed.createComponent(GuestLockTooltipComponent);
    fixture.componentRef.setInput('mobilePosition', true);
    fixture.detectChanges();
    const tooltip = fixture.nativeElement.querySelector('.tooltip');
    expect(tooltip.classList.contains('guest-msg-pos')).toBe(true);
  });

  it('gives the tooltip span a unique id', async () => {
    await configure(false);
    const fixtureA = TestBed.createComponent(GuestLockTooltipComponent);
    fixtureA.detectChanges();
    const idA = fixtureA.nativeElement.querySelector('.tooltip').getAttribute('id');
    expect(idA).toMatch(/^guest-lock-tooltip-\d+$/);
  });

  describe('projected trigger wiring (via host wrapper)', () => {
    let hostFixture: ComponentFixture<HostComponent>;

    beforeEach(async () => {
      await TestBed.configureTestingModule({
        imports: [HostComponent],
        providers: [{ provide: AuthService, useValue: { isGuest: () => false } }],
      }).compileComponents();
      hostFixture = TestBed.createComponent(HostComponent);
      hostFixture.detectChanges();
    });

    it('sets aria-describedby on every projected button to the tooltip id (ngAfterViewInit)', () => {
      const tooltip = hostFixture.nativeElement.querySelector('.tooltip');
      const tooltipId = tooltip.getAttribute('id');
      const buttons: HTMLButtonElement[] = Array.from(hostFixture.nativeElement.querySelectorAll('button'));

      expect(buttons.length).toBe(2);
      for (const button of buttons) {
        expect(button.getAttribute('aria-describedby')).toBe(tooltipId);
      }
    });
  });
});
