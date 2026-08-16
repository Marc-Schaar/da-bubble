import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProfileStatusComponent } from './profile-status.component';

describe('ProfileStatusComponent', () => {
  let component: ProfileStatusComponent;
  let fixture: ComponentFixture<ProfileStatusComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProfileStatusComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ProfileStatusComponent);
    component = fixture.componentInstance;
  });

  it('creates', () => {
    fixture.detectChanges();
    expect(component).toBeTruthy();
  });

  it('falls back to the default avatar when photoUrl is undefined', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img.profile-status__image');
    expect(img.getAttribute('src')).toBe('./img/avatars/avatar_default.png');
  });

  it('falls back to the default avatar when photoUrl is null', () => {
    fixture.componentRef.setInput('photoUrl', null);
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img.profile-status__image');
    expect(img.getAttribute('src')).toBe('./img/avatars/avatar_default.png');
  });

  it('falls back to the default avatar when photoUrl is an empty string', () => {
    fixture.componentRef.setInput('photoUrl', '');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img.profile-status__image');
    expect(img.getAttribute('src')).toBe('./img/avatars/avatar_default.png');
  });

  it('uses the given photoUrl when set', () => {
    fixture.componentRef.setInput('photoUrl', 'img/avatars/avatar_3.png');
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img.profile-status__image');
    expect(img.getAttribute('src')).toBe('img/avatars/avatar_3.png');
  });

  it('has alt="Profilbild" and lazy loading on the image', () => {
    fixture.detectChanges();
    const img = fixture.nativeElement.querySelector('img.profile-status__image');
    expect(img.getAttribute('alt')).toBe('Profilbild');
    expect(img.getAttribute('loading')).toBe('lazy');
  });

  it('does not mark the status dot online by default', () => {
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.profile-status__dot');
    expect(dot.classList.contains('profile-status__dot--online')).toBe(false);
  });

  it('marks the status dot online when online=true', () => {
    fixture.componentRef.setInput('online', true);
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.profile-status__dot');
    expect(dot.classList.contains('profile-status__dot--online')).toBe(true);
  });

  it('removes the online class again when online flips back to false', () => {
    fixture.componentRef.setInput('online', true);
    fixture.detectChanges();
    fixture.componentRef.setInput('online', false);
    fixture.detectChanges();
    const dot = fixture.nativeElement.querySelector('.profile-status__dot');
    expect(dot.classList.contains('profile-status__dot--online')).toBe(false);
  });
});
