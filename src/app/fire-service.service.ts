import { inject, Injectable } from '@angular/core';
import { doc, Firestore, updateDoc } from '@angular/fire/firestore';

@Injectable({
  providedIn: 'root',
})
export class FireServiceService {
  constructor() {}
  firestore: Firestore = inject(Firestore);

  async updateOnlineStatus(currentUser: any) {
    if (currentUser.uid) {
      const userRef = doc(this.firestore, 'users', currentUser.uid);
      await updateDoc(userRef, {
        online: currentUser.online,
      });
    }
  }
}
