import React, { useState, useEffect, useContext, createContext } from "react";
import fireauth from "utils/fireauth";
import { getIdTokenResult, logout } from "utils/auth.service";
import { ACCOUNT_TYPE } from "utils/consts";

const authContext = createContext();

export function ProvideAuth({ children }) {
  const auth = useProvideAuth();
  return <authContext.Provider value={auth}>{children}</authContext.Provider>;
}

export const useAuth = () => {
  return useContext(authContext);
};

const onAuthStateChanged = (f) => {
  const unsubscribe = fireauth.auth().onAuthStateChanged((user) => {
    if (user === null) {
      logout();
      unsubscribe();
      return;
    }

    f(user);
    unsubscribe();
  });
};

// Provider hook that creates auth object and handles state
function useProvideAuth() {
  const [roleState, setRoleState] = useState({
    role: ACCOUNT_TYPE.GUEST,
    isAdmin: false,
    isMentor: false,
    isMentee: false,
    isPartner: false,
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
      isPartner: false,
    });
    setProfileId(null);
    localStorage.removeItem("profileId");
  };

  // Subscribe to user on mount
  // Because this sets state in the callback it will cause any ...
  // ... component that utilizes this hook to re-render with the ...
  // ... latest auth object.
  useEffect(() => {
    const unsubscribe = fireauth.auth().onAuthStateChanged(async (user) => {
      if (!user) return;

      await getIdTokenResult(true)
        .then((idTokenResult) => {
          const { role, profileId } = idTokenResult.claims;
          setProfileId(profileId);
          localStorage.setItem("profileId", profileId);
          setRoleState({
            role: Number(role),
            isAdmin: `${role}` === `${ACCOUNT_TYPE.ADMIN}`,
            isMentor: `${role}` === `${ACCOUNT_TYPE.MENTOR}`,
            isMentee: `${role}` === `${ACCOUNT_TYPE.MENTEE}`,
            isPartner: `${role}` === `${ACCOUNT_TYPE.PARTNER}`,
          });

          Promise.resolve(idTokenResult).then(onAuthUpdate);
        })
        .catch(() => Promise.resolve(null).then(onAuthUpdate));
    });
    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);
  // Return the user object and auth methods
  return {
    role: roleState.role,
    isAdmin: roleState.isAdmin,
    isMentor: roleState.isMentor,
    isMentee: roleState.isMentee,
    isPartner: roleState.isPartner,
    profileId: profileId,
    resetRoleState,
    onAuthUpdate,
    onAuthStateChanged,
  };
}
