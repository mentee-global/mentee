import React, { useState, useEffect, createContext } from "react";
import firebase from "firebase";
import { getIdTokenResult, logout } from "utils/auth.service";
import { ACCOUNT_TYPE } from "utils/consts";
import { useHistory } from "react-router-dom";

const onAuthStateChanged = (f) => {
  const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
    if (user === null) {
      logout();
      unsubscribe();
      return;
    }

    f(user);
    unsubscribe();
  });
};

export const useAuth = () => {
  const history = useHistory();
  const [roleState, setRoleState] = useState({
    role: ACCOUNT_TYPE.GUEST,
    isAdmin: false,
    isMentor: false,
    isMentee: false,
  });

  const [profileId, setProfileId] = useState();
  const [onAuthUpdate, setOnAuthUpdate] = useState(
    new Promise((resolve) => resolve)
  );

  const resetRoleState = () => {
    setRoleState({
      role: ACCOUNT_TYPE.GUEST,
      isAdmin: false,
      isMentor: false,
      isMentee: false,
    });
  };

  // setup listener
  useEffect(() => {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) return;

      await getIdTokenResult(true)
        .then((idTokenResult) => {
          const { role, profileId } = idTokenResult.claims;
          setProfileId(profileId);
          setRoleState({
            role: role,
            isAdmin: role === ACCOUNT_TYPE.ADMIN,
            isMentor: role === ACCOUNT_TYPE.MENTOR,
            isMentee: role === ACCOUNT_TYPE.MENTEE,
          });

          Promise.resolve(idTokenResult).then(onAuthUpdate);
        })
        .catch(() => Promise.resolve(null).then(onAuthUpdate));
    });
  }, []);

  return {
    role: roleState.role,
    isAdmin: roleState.isAdmin,
    isMentor: roleState.isMentor,
    isMentee: roleState.isMentee,
    profileId: profileId,
    resetRoleState,
    onAuthUpdate,
    onAuthStateChanged,
  };
};

export default useAuth;

export const AuthContext = createContext();

export function ProvideAuth({ children }) {
  const userContext = useAuth();

  return (
    <AuthContext.Provider value={userContext}>{children}</AuthContext.Provider>
  );
}
