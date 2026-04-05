import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule, NgClass } from '@angular/common';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { filter, firstValueFrom, take } from 'rxjs';

import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

import { AuthService } from '../../../app_auth/services/auth/auth.service';
import { ChannelService } from '../../services/channel/channel.service';
import { UserService } from '../../../../shared/services/user/shared.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';

import { User } from '../../../app_auth/models/user/user';

@Component({
  selector: 'app-add-channel',
  imports: [CommonModule, FormsModule, NgClass, MatRadioModule, MatIcon, ReactiveFormsModule],
  templateUrl: './add-channel.component.html',
  styleUrls: ['./add-channel.component.scss'],
})
export class AddChannelComponent {
  public readonly channelService: ChannelService = inject(ChannelService);
  private readonly userService: UserService = inject(UserService);
  private readonly fireService: FireServiceService = inject(FireServiceService);
  private readonly authService: AuthService = inject(AuthService);
  private readonly dialogRef: MatDialogRef<AddChannelComponent> = inject(MatDialogRef);

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
  public allMembersSelected = signal<boolean>(true);

  public membersToSubmit = computed(() => {
    const currentUser = this.authService.currentUser();

    if (this.allMembersSelected()) {
      return this.fireService.allUsers().map((u) => ({ id: u.id }));
    } else {
      const selected = this.channelService.selectedUsers().map((u) => ({ id: u.id }));

      if (currentUser && !selected.some((m) => m.id === currentUser.id)) {
        selected.push({ id: currentUser.id });
      }
      return selected;
    }
  });

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

  public async onFirstStepSubmit() {
    if (this.channelForm.pending) {
      await firstValueFrom(
        this.channelForm.statusChanges.pipe(
          filter((s) => s !== 'PENDING'),
          take(1),
        ),
      );
    }
    if (this.channelForm.invalid) return;

    this.isAddMemberDialogOpen.set(true);
  }

  public setChannelMember(isSpecific: boolean) {
    this.allMembersSelected.set(!isSpecific);
    if (!isSpecific) {
      this.channelService.resetSelection();
    }
  }

  public onSelectUser(user: User) {
    this.channelService.addUserToSelection(user);
    this.showUserBar.set(false);
  }

  public async onFinalSubmit() {
    this.isSubmitting.set(true);

    try {
      const { name, description } = this.channelForm.getRawValue();

      await this.channelService.createChannel({
        name: name!,
        description: description || '',
        member: this.membersToSubmit(),
        creator: this.authService.currentUser()!.displayName,
        createdAt: new Date(),
      });

      this.userService.showFeedback('Channel erfolgreich erstellt');
      this.closeDialog();
      this.channelForm.reset();
      this.channelService.resetSelection();
    } catch (error) {
      console.error(error);
      this.userService.showFeedback('Fehler beim Erstellen');
    } finally {
      this.isSubmitting.set(false);
    }
  }

  public closeDialogAddMember() {
    this.isAddMemberDialogOpen.set(false);
    this.channelService.resetSelection();
  }

  public closeDialog() {
    this.dialogRef.close();
  }
}
