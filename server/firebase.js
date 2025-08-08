import admin from "firebase-admin";

admin.initializeApp({
    credential: admin.credential.cert(process.env.FIREBASE_FILE)
});


export default admin;
