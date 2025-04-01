import { inject, Injectable } from '@angular/core';
import {
  addDoc,
  collection,
  CollectionReference,
  doc,
  DocumentReference,
  Firestore,
  getDoc,
  getDocs,
  serverTimestamp,
  updateDoc,
} from '@angular/fire/firestore';
import { Message } from './models/message';
import { User } from './models/user';
import { user } from '@angular/fire/auth';

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

  getDocRef(ref: string, id: string): DocumentReference | null {
    return ref && id ? doc(this.firestore, ref, id) : null;
  }

  getCollectionRef(ref: string): CollectionReference | null {
    return ref ? collection(this.firestore, ref) : null;
  }

  getMessageRef(channelId: string, messageId: string): DocumentReference | null {
    return channelId && messageId ? this.getDocRef(`channels/${channelId}/messages`, messageId) : null;
  }

  updateMessage(ref: DocumentReference, value: any) {
    return ref ? updateDoc(ref, { message: value }) : null;
  }

  updateReaction(ref: DocumentReference, value: any) {
    return ref ? updateDoc(ref, { reaction: value }) : null;
  }

  async addThread(messageDocRef: DocumentReference, channelId: string) {
    let threadsCollectionRef = this.getCollectionRef(`channels/${channelId}/messages/${messageDocRef.id}/threads`);
    if (threadsCollectionRef) await addDoc(threadsCollectionRef, {});
  }

  async sendMessage(channelId: string, messageObject: any) {
    let messagesCollectionRef: CollectionReference | null = this.getCollectionRef(`channels/${channelId}/messages`);
    if (messagesCollectionRef) {
      let messageDocRef = await addDoc(messagesCollectionRef, new Message(messageObject).toJSON());
      this.addThread(messageDocRef, channelId);
    }
  }
}
