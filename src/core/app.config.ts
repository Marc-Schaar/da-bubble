import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import { getAuth, provideAuth } from '@angular/fire/auth';
import { getFirestore, provideFirestore } from '@angular/fire/firestore';

export const appConfig: ApplicationConfig = {
  providers: [provideZoneChangeDetection({ eventCoalescing: true }), provideRouter(routes), provideFirebaseApp(() => initializeApp({ projectId: "da-bubble-6b499", appId: "1:541571707880:web:1034b667b0fef0dfbbea5d", databaseURL: "https://da-bubble-6b499-default-rtdb.europe-west1.firebasedatabase.app", storageBucket: "da-bubble-6b499.firebasestorage.app", apiKey: "AIzaSyDyHgOhSccqviA3sW5tEU7ZB208mG2JBUY", authDomain: "da-bubble-6b499.firebaseapp.com", messagingSenderId: "541571707880" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore()), provideFirebaseApp(() => initializeApp({ projectId: "da-bubble-6b499", appId: "1:541571707880:web:1034b667b0fef0dfbbea5d", databaseURL: "https://da-bubble-6b499-default-rtdb.europe-west1.firebasedatabase.app", storageBucket: "da-bubble-6b499.firebasestorage.app", apiKey: "AIzaSyDyHgOhSccqviA3sW5tEU7ZB208mG2JBUY", authDomain: "da-bubble-6b499.firebaseapp.com", messagingSenderId: "541571707880" })), provideAuth(() => getAuth()), provideFirestore(() => getFirestore())]
};
