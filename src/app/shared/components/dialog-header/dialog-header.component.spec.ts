import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DialogHeaderComponent } from './dialog-header.component';

describe('DialogHeaderComponent', () => {
  let component: DialogHeaderComponent;
  let fixture: ComponentFixture<DialogHeaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DialogHeaderComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(DialogHeaderComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('title', 'Profile');
    fixture.detectChanges();
  });

  it('creates', () => {
    expect(component).toBeTruthy();
  });

  it('renders the title text', () => {
    const span = fixture.nativeElement.querySelector('header.profile-header span');
    expect(span?.textContent.trim()).toBe('Profile');
  });

  it('updates when the title input changes', () => {
    fixture.componentRef.setInput('title', 'Settings');
    fixture.detectChanges();
    const span = fixture.nativeElement.querySelector('header.profile-header span');
    expect(span?.textContent.trim()).toBe('Settings');
  });

  it('renders a close button with the correct aria-label and a close icon', () => {
    const btn = fixture.nativeElement.querySelector('app-button button');
    expect(btn.getAttribute('aria-label')).toBe('Schließen');
    const icon = fixture.nativeElement.querySelector('mat-icon');
    expect(icon?.textContent.trim()).toBe('close');
  });

  it('emits "closed" when the close button is clicked', () => {
    let emitted = 0;
    component.closed.subscribe(() => emitted++);

    const btn: HTMLButtonElement = fixture.nativeElement.querySelector('app-button button');
    btn.click();

    expect(emitted).toBe(1);
  });
});
