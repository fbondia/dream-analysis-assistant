import 'dotenv/config';
import dayjs from 'dayjs';
import firebase from 'firebase-admin';

if (!firebase.apps.length) {
  firebase.initializeApp({
    credential: firebase.credential.cert(process.env.FIREBASE_FILE)
  });
}

export const db = firebase.firestore();


export const removeRefFields = (obj) => {
    const cleaned = {}
    Object.entries(obj || {}).forEach(([key, value]) => {
        if (!key.endsWith('Ref')) {
            cleaned[key] = value
        }
    })
    return cleaned
}

export const deepCloneAndReplaceTimestamps = (obj) => {
  if (dayjs.isDayjs(obj) || obj instanceof Date) {
    return dayjs(obj).toDate();
  }

  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if ('seconds' in obj && 'nanoseconds' in obj &&
      typeof obj.seconds === 'number' && typeof obj.nanoseconds === 'number') {
    return new Date(obj.seconds * 1000 + obj.nanoseconds / 1e6);
  }

  if (Array.isArray(obj)) {
    return obj.map(item => deepCloneAndReplaceTimestamps(item));
  }

  let clonedObj = {};
  for (let key in obj) {
    if (Object.prototype.hasOwnProperty.call(obj, key)) {
      clonedObj[key] = deepCloneAndReplaceTimestamps(obj[key]);
    }
  }
  return clonedObj;
};

export const snapToObject = (docSnap) => {
  return {
    ...deepCloneAndReplaceTimestamps(docSnap.data()),
    id: docSnap.id,
  };
};
