import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useAuth } from "utils/hooks/useAuth";
import { fetchUser } from "features/userSlice";
import { fetchOptions } from "features/optionsSlice";
import { getProfileId, getRole } from "utils/auth.service";

function Initiator() {
  const { i18n } = useTranslation();
  const profileId = getProfileId();
  const role = getRole();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchOptions());
  }, [i18n.language]);

  useEffect(() => {
    if (profileId) {
      dispatch(fetchUser({ id: profileId, role }));
    }
  }, [role]);
  return <></>;
}

export default Initiator;
