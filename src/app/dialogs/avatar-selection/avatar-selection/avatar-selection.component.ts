import { AfterViewInit, Component, inject, Inject } from '@angular/core';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { NavigationService } from '../../../services/navigation/navigation.service';

@Component({
  selector: 'app-avatar-selection',
  imports: [MatIcon],
  templateUrl: './avatar-selection.component.html',
  styleUrl: './avatar-selection.component.scss',
})
export class AvatarSelectionComponent implements AfterViewInit {
  public navigationService = inject(NavigationService);

  constructor(public dialogRef: MatDialogRef<AvatarSelectionComponent>, @Inject(MAT_DIALOG_DATA) public data: any) {}
  public selectedAvatar: string = '';

  /**
   * Lifecycle hook that runs after the component's view has been fully initialized.
   * Sets the initially selected avatar based on the user's current photoURL.
   */
  ngAfterViewInit() {
    this.selectedAvatar = this.data?.user?.photoURL;
  }

  /**
   * Updates the currently selected avatar.
   * @param avatar - The URL or identifier of the avatar to be selected.
   */
  setAvatar(avatar: string) {
    this.selectedAvatar = avatar;
  }

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
    this.dialogRef.close(this.selectedAvatar);
  }
}
