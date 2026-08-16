import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { AvatarSelectionComponent } from './avatar-selection.component';
import { AVATAR_IMAGES } from '../../constants';
import { makeUser } from '../../../../testing/user-fixtures';

describe('AvatarSelectionComponent', () => {
  let fixture: ComponentFixture<AvatarSelectionComponent>;
  let component: AvatarSelectionComponent;
  let dialogRefSpy: jasmine.SpyObj<MatDialogRef<AvatarSelectionComponent>>;

  function configure(data: unknown) {
    dialogRefSpy = jasmine.createSpyObj<MatDialogRef<AvatarSelectionComponent>>('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [AvatarSelectionComponent],
      providers: [
        { provide: MatDialogRef, useValue: dialogRefSpy },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AvatarSelectionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  }

  describe('with a user that has a photoUrl', () => {
    const user = makeUser({ displayName: 'Erika Musterfrau', photoUrl: 'img/avatars/avatar_3.png' });

    beforeEach(() => configure({ user }));

    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('initializes selectedAvatar from data.user.photoUrl', () => {
      expect(component.selectedAvatar()).toBe('img/avatars/avatar_3.png');
    });

    it('renders the user displayName and the currently selected avatar image', () => {
      expect((fixture.nativeElement.textContent as string)).toContain('Erika Musterfrau');
      const img = fixture.nativeElement.querySelector('.profile-img');
      expect(img.getAttribute('src')).toBe('img/avatars/avatar_3.png');
    });

    it('highlights the initially selected avatar in the picker grid', () => {
      const selectedBtn = fixture.nativeElement.querySelector('app-avatar-picker .avatar-option.selected img');
      expect(selectedBtn.getAttribute('src')).toBe('img/avatars/avatar_3.png');
    });

    it('picking a different avatar updates selectedAvatar and the preview image', () => {
      const options: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('app-avatar-picker .avatar-option');
      const otherIndex = AVATAR_IMAGES.findIndex((a) => a !== 'img/avatars/avatar_3.png');
      options[otherIndex].click();
      fixture.detectChanges();

      expect(component.selectedAvatar()).toBe(AVATAR_IMAGES[otherIndex]);
      expect(fixture.nativeElement.querySelector('.profile-img').getAttribute('src')).toBe(AVATAR_IMAGES[otherIndex]);
    });

    it('onClose() closes the dialog without a result', () => {
      component.onClose();
      expect(dialogRefSpy.close).toHaveBeenCalledOnceWith();
    });

    it('clicking the close button calls onClose()', () => {
      spyOn(component, 'onClose');
      const closeBtn = fixture.nativeElement.querySelector('.headline app-button button');
      closeBtn.click();
      expect(component.onClose).toHaveBeenCalledTimes(1);
    });

    it('onSave() closes the dialog with the currently selected avatar', () => {
      const options: NodeListOf<HTMLButtonElement> = fixture.nativeElement.querySelectorAll('app-avatar-picker .avatar-option');
      options[1].click();
      fixture.detectChanges();

      component.onSave();
      expect(dialogRefSpy.close).toHaveBeenCalledOnceWith(AVATAR_IMAGES[1]);
    });

    it('clicking "Weiter" calls onSave()', () => {
      spyOn(component, 'onSave');
      const saveBtn = Array.from(fixture.nativeElement.querySelectorAll('app-button')).find((el: any) =>
        el.textContent?.includes('Weiter'),
      ) as HTMLElement;
      saveBtn.querySelector('button')!.click();
      expect(component.onSave).toHaveBeenCalledTimes(1);
    });
  });

  describe('with no user data (defensive default)', () => {
    beforeEach(() => configure({}));

    it('defaults selectedAvatar to an empty string when data.user is missing', () => {
      expect(component.selectedAvatar()).toBe('');
    });
  });
});
