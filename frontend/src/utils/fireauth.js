import firebase from "firebase/app";
import "firebase/auth";
import "firebase/analytics";

const fireauth = firebase.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "mentee-d0304.firebaseapp.com",
  projectId: "mentee-d0304",
  storageBucket: "mentee-d0304.appspot.com",
  messagingSenderId: "64054250486",
  appId: "1:64054250486:web:5dda0b621ca92dc03ad5d7",
  measurementId: "G-HSJ2934X33",
});

firebase.analytics();

export default fireauth;
