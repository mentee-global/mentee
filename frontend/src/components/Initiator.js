import React, { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { useAuth } from "utils/hooks/useAuth";
import { fetchUser } from "features/userSlice";
import { fetchOptions } from "features/optionsSlice";

function Initiator() {
  const { i18n } = useTranslation();
  const { profileId, role } = useAuth();
  const dispatch = useDispatch();

  useEffect(() => {
    dispatch(fetchOptions());
  }, [i18n.language]);

  useEffect(() => {
    if (profileId) {
      dispatch(fetchUser({ id: profileId, role }));
    }
  }, [role, profileId]);
  return <></>;
}

export default Initiator;
