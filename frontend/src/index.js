import React from "react";
import ReactDOM from "react-dom";
import "antd/dist/antd.css";
import "./index.scss";
import App from "app/App";
import * as serviceWorker from "utils/serviceWorker";
import firebase from "firebase";
import { Provider } from "react-redux";
import store from "./app/store";

firebase.initializeApp({
  apiKey: process.env.REACT_APP_FIREBASE_API_KEY,
  authDomain: "mentee-d0304.firebaseapp.com",
  projectId: "mentee-d0304",
  storageBucket: "mentee-d0304.appspot.com",
  messagingSenderId: "64054250486",
  appId: "1:64054250486:web:5dda0b621ca92dc03ad5d7",
  measurementId: "G-HSJ2934X33",
});

firebase.analytics();

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
