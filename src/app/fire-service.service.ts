import { inject, Injectable } from '@angular/core';
import {
  collection,
  doc,
  Firestore,
  getDocs,
  updateDoc,
} from '@angular/fire/firestore';

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

  async getUsers() {
    try {
      const usersCollection = collection(this.firestore, 'users');
      const userSnapshot = await getDocs(usersCollection);
      return userSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error loading users:', error);
      throw error;
    }
  }

  async getChannels() {
    try {
      const channelCollection = collection(this.firestore, 'channels');
      const channelSnapshot = await getDocs(channelCollection);
      return channelSnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (error) {
      console.error('Error loading channels:', error);
      throw error;
    }
  }

  getDocRef(ref: string, id: string) {
    return ref && id ? doc(this.firestore, ref, id) : null;
  }

  getCollectionRef(ref: string) {
    return ref ? collection(this.firestore, ref) : null;
  }
}
