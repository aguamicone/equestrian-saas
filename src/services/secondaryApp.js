import { initializeApp, getApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { firebaseConfig } from './firebase';

let secondaryApp;
try {
  secondaryApp = getApp('secondary');
} catch {
  secondaryApp = initializeApp(firebaseConfig, 'secondary');
}

export const secondaryAuth = getAuth(secondaryApp);
