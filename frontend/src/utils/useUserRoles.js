import React, { useCallback, useState, useEffect } from "react";
import firebase from "firebase";
import { getIdTokenResult } from "utils/auth.service";
import { ACCOUNT_TYPE } from "utils/consts";

const useUserRoles = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [isMentee, setIsMentee] = useState(false);

  // setup listener
  useEffect(() => {
    firebase.auth().onAuthStateChanged(async (user) => {
      if (!user) {
        setIsAdmin(false);
        setIsMentor(false);
        setIsMentee(false);
        return;
      }

      await getIdTokenResult().then((idTokenResult) => {
        const role = idTokenResult.claims.role;
        setIsAdmin(role === ACCOUNT_TYPE.ADMIN);
        setIsMentor(role === ACCOUNT_TYPE.MENTOR);
        setIsMentee(role === ACCOUNT_TYPE.MENTEE);
      });
    });
  }, []);

  return { isAdmin, isMentor, isMentee };
};

export default useUserRoles;
