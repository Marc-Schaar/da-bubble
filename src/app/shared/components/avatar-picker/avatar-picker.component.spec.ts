import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AvatarPickerComponent } from './avatar-picker.component';
import { AVATAR_IMAGES } from '../../constants';

describe('AvatarPickerComponent', () => {
  let component: AvatarPickerComponent;
  let fixture: ComponentFixture<AvatarPickerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AvatarPickerComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarPickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('renders one button per avatar in AVATAR_IMAGES', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.avatar-option');
    expect(buttons.length).toBe(AVATAR_IMAGES.length);
  });

  it('renders each avatar image with its src', () => {
    const images: NodeListOf<HTMLImageElement> = fixture.nativeElement.querySelectorAll('.avatar-option img');
    expect(images.length).toBe(AVATAR_IMAGES.length);
    images.forEach((img, index) => {
      expect(img.getAttribute('src')).toBe(AVATAR_IMAGES[index]);
    });
  });

  it('none of the avatars are highlighted/selected when selected is empty', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.avatar-option');
    buttons.forEach((btn) => {
      expect(btn.classList.contains('selected')).toBeFalse();
      expect(btn.getAttribute('aria-pressed')).toBe('false');
    });
  });

  it('highlights the currently-selected avatar via the selected model input', () => {
    fixture.componentRef.setInput('selected', AVATAR_IMAGES[2]);
    fixture.detectChanges();

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.avatar-option');
    buttons.forEach((btn, index) => {
      expect(btn.classList.contains('selected')).toBe(index === 2);
      expect(btn.getAttribute('aria-pressed')).toBe(index === 2 ? 'true' : 'false');
    });
  });

  it('clicking an avatar updates the selected model to that avatar', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.avatar-option');
    buttons[3].click();
    fixture.detectChanges();

    expect(component.selected()).toBe(AVATAR_IMAGES[3]);
  });

  it('clicking an avatar emits the two-way selected model change', () => {
    let emitted: string | undefined;
    component.selected.subscribe((value: string) => (emitted = value));

    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.avatar-option');
    buttons[0].click();
    fixture.detectChanges();

    expect(emitted).toBe(AVATAR_IMAGES[0]);
  });

  it('provides a descriptive aria-label per avatar', () => {
    const buttons: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('.avatar-option');
    expect(buttons[0].getAttribute('aria-label')).toBe('Avatar 1 auswählen');
    expect(buttons[1].getAttribute('aria-label')).toBe('Avatar 2 auswählen');
  });
});
