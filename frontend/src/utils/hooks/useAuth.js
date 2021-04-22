import React, { useCallback, useState, useEffect } from "react";
import firebase from "firebase";
import { getIdTokenResult } from "utils/auth.service";
import { ACCOUNT_TYPE } from "utils/consts";

const onAuthStateChanged = (f) => {
  const unsubscribe = firebase.auth().onAuthStateChanged((user) => {
    f(user);
    unsubscribe();
  });
};

const useAuth = () => {
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

      await getIdTokenResult()
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
