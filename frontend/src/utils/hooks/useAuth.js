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
    isGuest: false,
    isHub: false,
  });

  const [profileId, setProfileId] = useState();
  const [onAuthUpdate, setOnAuthUpdate] = useState(
    new Promise((resolve) => resolve)
  );

  const resetRoleState = (profile_id = null, role = null) => {
    if (profile_id) {
      setRoleState({
        role: Number(role),
        isAdmin: `${role}` === `${ACCOUNT_TYPE.ADMIN}`,
        isMentor: `${role}` === `${ACCOUNT_TYPE.MENTOR}`,
        isMentee: `${role}` === `${ACCOUNT_TYPE.MENTEE}`,
        isPartner: `${role}` === `${ACCOUNT_TYPE.PARTNER}`,
        isGuest: `${role}` === `${ACCOUNT_TYPE.GUEST}`,
        isHub: `${role}` === `${ACCOUNT_TYPE.HUB}`,
      });
      setProfileId(profile_id);
    } else {
      setRoleState({
        role: ACCOUNT_TYPE.GUEST,
        isAdmin: false,
        isMentor: false,
        isMentee: false,
        isPartner: false,
        isGuest: false,
        isHub: false,
      });
      setProfileId(null);
      localStorage.removeItem("profileId");
    }
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
          const supportUserID = localStorage.getItem("support_user_id");
          const cur_role = localStorage.getItem("role");
          const cur_user_id = localStorage.getItem("profileId");
          if (!(role == ACCOUNT_TYPE.SUPPORT && supportUserID)) {
            setProfileId(profileId);
            localStorage.setItem("profileId", profileId);
            setRoleState({
              role: Number(role),
              isAdmin: `${role}` === `${ACCOUNT_TYPE.ADMIN}`,
              isMentor: `${role}` === `${ACCOUNT_TYPE.MENTOR}`,
              isMentee: `${role}` === `${ACCOUNT_TYPE.MENTEE}`,
              isPartner: `${role}` === `${ACCOUNT_TYPE.PARTNER}`,
              isGuest: `${role}` === `${ACCOUNT_TYPE.GUEST}`,
              isHub: `${role}` === `${ACCOUNT_TYPE.HUB}`,
            });

            Promise.resolve(idTokenResult).then(onAuthUpdate);
          } else {
            setProfileId(cur_user_id);
            setRoleState({
              role: Number(cur_role),
              isAdmin: `${cur_role}` === `${ACCOUNT_TYPE.ADMIN}`,
              isMentor: `${cur_role}` === `${ACCOUNT_TYPE.MENTOR}`,
              isMentee: `${cur_role}` === `${ACCOUNT_TYPE.MENTEE}`,
              isPartner: `${cur_role}` === `${ACCOUNT_TYPE.PARTNER}`,
              isGuest: `${cur_role}` === `${ACCOUNT_TYPE.GUEST}`,
              isHub: `${role}` === `${ACCOUNT_TYPE.HUB}`,
            });
          }
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
    isGuest: roleState.isGuest,
    isHub: roleState.isHub,
    profileId: profileId,
    resetRoleState,
    onAuthUpdate,
    onAuthStateChanged,
  };
}
