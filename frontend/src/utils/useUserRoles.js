import React, { useCallback, useState, useEffect } from "react";
import firebase from "firebase";
import { isUserAdmin, isUserMentor, isUserMentee } from "utils/auth.service";

const useUserRoles = () => {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isMentor, setIsMentor] = useState(false);
  const [isMentee, setIsMentee] = useState(false);

  // setup listener
  useEffect(() => {
    firebase.auth().onAuthStateChanged(async () => {
      if (await isUserAdmin()) {
        setIsAdmin(true);
        setIsMentor(false);
        setIsMentee(false);
      } else if (await isUserMentor()) {
        setIsAdmin(false);
        setIsMentor(true);
        setIsMentee(false);
      } else if (await isUserMentee()) {
        setIsAdmin(false);
        setIsMentor(false);
        setIsMentee(false);
      } else {
        setIsAdmin(false);
        setIsMentor(false);
        setIsMentee(false);
      }
    });
  }, []);

  return {isAdmin, isMentor, isMentee}
};

export default useUserRoles;
