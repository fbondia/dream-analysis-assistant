import 'dotenv/config';
import firebase from 'firebase-admin';

if (!firebase.apps.length) {
  firebase.initializeApp({
    credential: firebase.credential.cert(process.env.FIREBASE_FILE)
  });
}

export default firebase
