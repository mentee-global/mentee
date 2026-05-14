import React, { useEffect, useState } from "react";
import { Alert } from "antd";
import { useTranslation } from "react-i18next";

// Sticky banner shown while the browser reports `navigator.onLine === false`.
// Purely informational — the app does not become offline-capable; this just
// warns the user before they fill out a form whose submit will fail.
const OfflineBanner = () => {
  const { t } = useTranslation();
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
  );

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
      message={
        t("offline.banner") ||
        "You are offline. Changes may not save until your connection returns."
      }
      style={{ position: "sticky", top: 0, zIndex: 9999 }}
    />
  );
};

export default OfflineBanner;
