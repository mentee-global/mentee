import React, { useCallback, useState, useEffect } from "react";
import firebase from "firebase";
import { getIdTokenResult } from "utils/auth.service";
import { ACCOUNT_TYPE } from "utils/consts";

const useAuth = () => {
  // reduce number of state variables
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [isMentee, setIsMentee] = useState(false);
  const [role, setRole] = useState(ACCOUNT_TYPE.MENTOR);
  const [profileId, setProfileId] = useState();
  const [onAuthUpdate, setOnAuthUpdate] = useState(
    new Promise((resolve) => resolve)
  );

  // setup listener
  useEffect(() => {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) return;

      await getIdTokenResult()
        .then((idTokenResult) => {
          const {role, profileId} = idTokenResult.claims;
          
          setProfileId(profileId);
          setRole(role);
          setIsAdmin(role === ACCOUNT_TYPE.ADMIN);
          setIsMentor(role === ACCOUNT_TYPE.MENTOR);
          setIsMentee(role === ACCOUNT_TYPE.MENTEE);

          Promise.resolve(idTokenResult).then(onAuthUpdate);
        })
        .catch(() => Promise.resolve(null).then(onAuthUpdate));
    });
  }, []);

  return { isAdmin, isMentor, isMentee, onAuthUpdate, role };
};

export default useAuth;
