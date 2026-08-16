import { ComponentFixture, TestBed } from '@angular/core/testing';

import { UnreadBadgeComponent } from './unread-badge.component';

describe('UnreadBadgeComponent', () => {
  let component: UnreadBadgeComponent;
  let fixture: ComponentFixture<UnreadBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UnreadBadgeComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(UnreadBadgeComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('renders nothing when count is 0 (default)', () => {
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.unread-badge')).toBeFalsy();
  });

  it('renders nothing for a negative count', () => {
    fixture.componentRef.setInput('count', -5);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.unread-badge')).toBeFalsy();
  });

  it('renders the exact count for values between 1 and 99', () => {
    fixture.componentRef.setInput('count', 5);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.unread-badge');
    expect(badge?.textContent.trim()).toBe('5');
  });

  it('renders the exact count at the boundary value 99', () => {
    fixture.componentRef.setInput('count', 99);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.unread-badge');
    expect(badge?.textContent.trim()).toBe('99');
  });

  it('caps the display at "99+" for count 100', () => {
    fixture.componentRef.setInput('count', 100);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.unread-badge');
    expect(badge?.textContent.trim()).toBe('99+');
  });

  it('caps the display at "99+" for a much larger count', () => {
    fixture.componentRef.setInput('count', 1000);
    fixture.detectChanges();
    const badge = fixture.nativeElement.querySelector('.unread-badge');
    expect(badge?.textContent.trim()).toBe('99+');
  });

  it('hides the badge again when count drops back to 0', () => {
    fixture.componentRef.setInput('count', 3);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.unread-badge')).toBeTruthy();

    fixture.componentRef.setInput('count', 0);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.unread-badge')).toBeFalsy();
  });
});
