import React, { useCallback, useState, useEffect } from "react";
import firebase from "firebase";
import { getIdTokenResult } from "utils/auth.service";
import { ACCOUNT_TYPE } from "utils/consts";

const useAuth = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [isMentee, setIsMentee] = useState(false);
  const [role, setRole] = useState(ACCOUNT_TYPE.MENTOR);
  const [claims, setClaims] = useState({});
  const [onAuthUpdate, setOnAuthUpdate] = useState(
    new Promise((resolve) => resolve)
  );

  // setup listener
  useEffect(() => {
    firebase.auth().onAuthStateChanged(async (user) => {
      await getIdTokenResult()
        .then((idTokenResult) => {
          Promise.resolve(idTokenResult).then(onAuthUpdate);
          setClaims(idTokenResult.claims);

          const role = idTokenResult.claims.role;
          setRole(role);
          setIsAdmin(role === ACCOUNT_TYPE.ADMIN);
          setIsMentor(role === ACCOUNT_TYPE.MENTOR);
          setIsMentee(role === ACCOUNT_TYPE.MENTEE);
        })
        .catch(() => Promise.resolve(null).then(onAuthUpdate));
    });
  }, []);

  return { isAdmin, isMentor, isMentee, onAuthUpdate, role };
};

export default useAuth;
