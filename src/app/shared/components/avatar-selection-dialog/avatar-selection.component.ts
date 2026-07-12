import { Component, inject, signal } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { AvatarPickerComponent } from '../avatar-picker/avatar-picker.component';

@Component({
  selector: 'app-avatar-selection',
  imports: [MatIcon, AvatarPickerComponent],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
})
export class AvatarSelectionComponent {
  public readonly dialogRef = inject(MatDialogRef<AvatarSelectionComponent>);
  public readonly data = inject<any>(MAT_DIALOG_DATA);

  public selectedAvatar = signal<string>(this.data?.user?.photoUrl || this.data?.user?.photoURL || '');

  /**
   * Closes the dialog without saving any changes.
   */
  onClose() {
    this.dialogRef.close();
  }

  /**
   * Closes the dialog and returns the selected avatar to the calling component.
   */
  onSave() {
    this.dialogRef.close(this.selectedAvatar());
  }
}
