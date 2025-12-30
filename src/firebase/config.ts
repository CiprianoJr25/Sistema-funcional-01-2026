
// @ts-nocheck
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// Esta é a configuração real do seu projeto Firebase.
export const firebaseConfig = {
  "projectId": "studio-7906776988-e180b",
  "appId": "1:658057403704:web:8cac8e494a14217152f5cd",
  "apiKey": "AIzaSyBxMtuq_RDU5savRHCzlw1YHychkRc9Mzg",
  "authDomain": "studio-7906776988-e180b.firebaseapp.com",
  "storageBucket": "studio-7906776988-e180b.appspot.com",
  "measurementId": "",
  "messagingSenderId": "658057403704"
};

// Initialize Firebase safely
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const storage = getStorage(app);
export default app;

