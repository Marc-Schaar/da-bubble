import { Component, inject, OnInit } from '@angular/core';
import { User } from '../../models/user/user';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-dialog-reciver',
  imports: [],
  templateUrl: './dialog-reciver.component.html',
  styleUrl: './dialog-reciver.component.scss',
})
export class DialogReciverComponent implements OnInit {
  user: User | null = null;
  displayName: string | null = null;
  email: string | null = null;
  photoURL: string | null = null;
  emailVerified: boolean = false;
  uid: string | null = null;

  readonly reciverData = inject<any>(MAT_DIALOG_DATA);
  readonly dialogRef = inject(MatDialogRef<DialogReciverComponent>);

  ngOnInit() {
    console.log('Daten', this.reciverData);

    // this.user = new User();
    // if (this.user) {
    //   // this.displayName = this.user.displayName;
    //   // this.email = this.user.email;
    //   // this.photoURL = this.user.photoURL;
    //   // this.emailVerified = this.user.emailVerified;
    //   // this.uid = this.user.uid;
    // }
  }

  /**
   * Closes the menu and emits an event to notify the parent component that the content should be hidden.
   */
  closeMenu() {
    this.dialogRef.close();
  }
}
