import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  useEffect(() => {
    if (profileId && role != null) {
      dispatch(fetchUser({ id: profileId, role }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default Initiator;
