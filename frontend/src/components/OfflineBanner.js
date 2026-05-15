import React, { useEffect, useState } from "react";
import { Alert } from "antd";
import { useTranslation } from "react-i18next";

// Sticky banner shown while the browser reports `navigator.onLine === false`.
// Purely informational — the app does not become offline-capable; this just
// warns the user before they fill out a form whose submit will fail.
//
// We deliberately initialize state to "online" rather than reading
// `navigator.onLine` at mount: Chromium reports stale values (e.g., after
// DevTools "Offline" throttling) and the very fact that the page loaded
// implies the network worked at that moment. The banner only appears on a
// fresh `offline` event during the session.
const OfflineBanner = () => {
  const { t } = useTranslation();
  const [online, setOnline] = useState(true);

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <Alert
      type="warning"
      banner
      showIcon
      message={t("offline.banner", {
        defaultValue:
          "You are offline. Changes may not save until your connection returns.",
      })}
      style={{ position: "sticky", top: 0, zIndex: 9999 }}
    />
  );
};

export default OfflineBanner;
