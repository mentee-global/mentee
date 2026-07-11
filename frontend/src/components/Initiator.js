import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { fetchUser } from "features/userSlice";
import { fetchOptions } from "features/optionsSlice";
import { getProfileId, getRole } from "utils/auth.service";

function Initiator() {
  const { i18n } = useTranslation();
  const profileId = getProfileId();
  const role = getRole();
  const dispatch = useDispatch();
  const optionsStatus = useSelector((state) => state.options.status);
  const optionsRetried = useRef(false);

  useEffect(() => {
    dispatch(fetchOptions());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [i18n.language]);

  // A single transient failure would otherwise leave the shared options
  // (specializations, languages) empty for the entire session, which breaks
  // things like the "Choose Interest Areas" picker. Retry once on failure.
  useEffect(() => {
    if (optionsStatus === "failed" && !optionsRetried.current) {
      optionsRetried.current = true;
      dispatch(fetchOptions());
    }
  }, [optionsStatus, dispatch]);

  useEffect(() => {
    if (profileId && role != null) {
      dispatch(fetchUser({ id: profileId, role }));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

export default Initiator;
