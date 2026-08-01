import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AbstractControl, FormBuilder, FormsModule, ReactiveFormsModule, ValidationErrors, Validators } from '@angular/forms';

import { filter, firstValueFrom, take } from 'rxjs';

import { MatDialogRef } from '@angular/material/dialog';
import { MatIcon } from '@angular/material/icon';
import { MatRadioModule } from '@angular/material/radio';

import { AuthService } from '../../../auth/services/auth/auth.service';
import { ChannelService } from '../../services/channel/channel.service';
import { FireServiceService } from '../../../../shared/services/firebase/fire-service.service';

import { User } from '../../../auth/models/user/user';
import { ProfileStatusComponent } from '../../../../shared/components/profile-status/profile-status.component';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { InputComponent } from '../../../../shared/components/input/input.component';
import { NotificationService } from '../../../../shared/services/notification/notification.service';
import { FocusTrapPanelDirective } from '../../../../shared/directives/focus-trap-panel.directive';

@Component({
  selector: 'app-add-channel',
  imports: [
    CommonModule,
    FormsModule,
    MatRadioModule,
    MatIcon,
    ReactiveFormsModule,
    ProfileStatusComponent,
    ButtonComponent,
    InputComponent,
    FocusTrapPanelDirective,
  ],
  templateUrl: './add-channel.component.html',
  styleUrls: ['./add-channel.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddChannelComponent {
  public readonly channelService: ChannelService = inject(ChannelService);
  private readonly notificationService: NotificationService = inject(NotificationService);
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
    this.channelService.allMembersSelected.set(!isSpecific);
    if (!isSpecific) this.channelService.resetSelection();
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
        member: this.channelService.membersToSubmit(),
        createdBy: this.authService.currentUser()!.id,
        createdAt: new Date(),
      });

      this.notificationService.success('Channel erfolgreich erstellt');
      this.closeDialog();
      this.channelForm.reset();
      this.channelService.resetSelection();
    } catch (error) {
      console.error(error);
      this.notificationService.error('Fehler beim Erstellen');
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

  protected getChannelNameError(): string | null {
    const control = this.channelForm.controls.name;
    if (control.errors?.['nameTaken']) return 'Dieser Name ist bereits vergeben.';
    if (control.touched && control.errors?.['required']) return 'Name ist erforderlich.';
    if (control.touched && control.errors?.['minlength']) return 'Mindestens 3 Zeichen erforderlich.';
    return null;
  }
}
