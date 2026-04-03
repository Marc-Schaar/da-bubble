import { Component, Inject, inject, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { MatRadioModule } from '@angular/material/radio';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { Channel } from '../../models/channel/channel';

import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { UserService } from '../../../../shared/services/user/shared.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';
import { MatIcon } from '@angular/material/icon';
import { ChannelService } from '../../services/channel/channel.service';
import { filter, firstValueFrom, take } from 'rxjs';
import { User } from '../../../app_auth/models/user/user';

@Component({
  selector: 'app-add-channel',
  imports: [CommonModule, FormsModule, NgClass, MatRadioModule, MatIcon, ReactiveFormsModule],
  templateUrl: './add-channel.component.html',
  styleUrls: ['./add-channel.component.scss'],
})
export class AddChannelComponent {
  chooseMember: boolean = false;
  showFeedback: boolean = false;
  showUserFeedback: boolean = false;

  public readonly channelService: ChannelService = inject(ChannelService);
  private readonly userService: UserService = inject(UserService);
  private readonly fireService: FireServiceService = inject(FireServiceService);

  private fb = inject(FormBuilder);
  public channelForm = this.fb.group({
    name: [
      '',
      {
        validators: [Validators.required],
        asyncValidators: [this.channelNameValidator()],
        updateOn: 'blur',
      },
    ],
    description: [''],
  });
  public isSubmitting = signal(false);
  public isAddMemberDialogOpen = signal(false);
  public showUserBar = signal(false);

  /**
   * Constructor for AddChannelComponent. Initializes the component with the platform ID,
   * Firestore service, and dialog reference.
   *
   * @param platformId - Platform ID, used to determine the platform the app is running on (e.g., browser or server).
   * @param firestore - Firestore service instance for interacting with the Firestore database.
   * @param dialogRef - Reference to the dialog for controlling the dialog box.
   */
  constructor(
    public dialogRef: MatDialogRef<AddChannelComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { channels: any[] },
  ) {}

  private channelNameValidator() {
    return async (control: AbstractControl): Promise<ValidationErrors | null> => {
      const name = control.value;
      if (!name || name.length < 3) return null;

      try {
        const isTaken = await this.fireService.checkChannelNameExists(name);
        return isTaken ? { nameTaken: true } : null;
      } catch (e) {
        return null;
      }
    };
  }

  public async onSubmit() {
    if (this.channelForm.pending) {
      await firstValueFrom(
        this.channelForm.statusChanges.pipe(
          filter((status) => status !== 'PENDING'),
          take(1),
        ),
      );
    }
    if (this.channelForm.invalid) return;

    const { name, description } = this.channelForm.getRawValue();
    this.isSubmitting.set(true);
    try {
      await this.channelService.createChannel({
        name: name!,
        description: description || '',
        member: [],
      });
      this.isAddMemberDialogOpen.set(true);

      this.userService.showFeedback('Channel erfolgreich erstellt');
      this.channelForm.reset();
    } catch (error) {
      this.userService.showFeedback('Fehler beim Erstellen');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public setChannelMember(isSpecific: boolean) {
    this.chooseMember = isSpecific;
    if (!isSpecific) {
      this.channelService.resetSelection();
    }
  }

  public onSelectUser(user: User) {
    this.channelService.addUserToSelection(user);
    this.showUserBar.set(false);
  }

  public async addUserToChannel() {
    const channelId = this.channelService.currentChannel()?.id;
    if (!channelId) return;

    let membersToAdd: { id: string }[] = [];

    if (!this.chooseMember) {
      membersToAdd = this.fireService.allUsers().map((u) => ({ id: u.id }));
    } else {
      membersToAdd = this.channelService.selectedUsers().map((u) => ({ id: u.id }));
    }

    await this.channelService.addMembers(channelId, membersToAdd);
    this.dialogRef.close();
  }

  public closeDialogAddMember() {
    this.isAddMemberDialogOpen.set(false);
    this.channelService.resetSelection();
  }

  public closeDialog() {
    this.dialogRef.close();
  }
}
