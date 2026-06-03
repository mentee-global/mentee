import io from "socket.io-client";
import { BASE_URL } from "./consts";
import fireauth from "./fireauth";

// `auth` is provided as a function so socket.io-client invokes it before EVERY
// connection attempt, including automatic reconnects. Firebase ID tokens expire
// after ~1h; fetching a fresh token here (getIdToken refreshes when expired)
// prevents reconnects from replaying a stale token and being rejected by the
// backend connect handler, which would otherwise silently break messaging.
const socket = io(BASE_URL, {
  autoConnect: false,
  auth: (cb) => {
    const user = fireauth.auth().currentUser;
    if (!user) {
      cb({});
      return;
    }
    user
      .getIdToken()
      .then((token) => cb({ token }))
      .catch(() => cb({}));
  },
});

fireauth.auth().onAuthStateChanged((user) => {
  if (!user) {
    socket.disconnect();
    return;
  }
  if (!socket.connected) {
    socket.connect();
  }
});

export default socket;
