import { Suspense } from "react";
import { createRoot } from "react-dom/client";
import "./index.scss";
import App from "app/App";
import * as serviceWorker from "utils/serviceWorker";
import { Provider } from "react-redux";
import store from "./app/store";
import moment from "moment";
import dayjs from "dayjs";
import "moment/locale/es";
import "moment/locale/ar";
import "moment/locale/fa";
import "moment/locale/pt";
import "dayjs/locale/es";
import "dayjs/locale/ar";
import "dayjs/locale/fa";
import "dayjs/locale/pt";
import weekday from "dayjs/plugin/weekday";
import localeData from "dayjs/plugin/localeData";
import weekOfYear from "dayjs/plugin/weekOfYear";
import weekYear from "dayjs/plugin/weekYear";
import advancedFormat from "dayjs/plugin/advancedFormat";
import customParseFormat from "dayjs/plugin/customParseFormat";
import i18n from "utils/i18n";
import { ProvideAuth } from "utils/hooks/useAuth";
import ErrorBoundary from "components/ErrorBoundary";
import OfflineBanner from "components/OfflineBanner";
import { reportClientError } from "utils/errorReport";

// Ant Design v5's date pickers (Calendar, DatePicker, TimePicker) call
// weekday()/localeData()/etc. on the dayjs objects we hand them. antd extends
// its own dayjs internally, but under pnpm's isolated node_modules our dayjs
// instance is a separate copy that never receives those extensions, so the
// pickers crash with "t.weekday is not a function". Register the plugins antd
// relies on here, on our dayjs instance.
dayjs.extend(customParseFormat);
dayjs.extend(advancedFormat);
dayjs.extend(weekday);
dayjs.extend(localeData);
dayjs.extend(weekOfYear);
dayjs.extend(weekYear);

// Suppress ResizeObserver loop error (harmless browser/React warning) and
// report everything else to the backend so we know when users hit crashes.
// Transient connectivity errors (offline, dropped Wi-Fi, dropped fetches
// during navigation) are noise: the user retries and they go away. We
// don't want them to page admins, so we filter them at the reporter.
const isTransientNetworkError = (message) => {
  if (typeof message !== "string") return false;
  const m = message.toLowerCase();
  return (
    m === "network error" ||
    m.includes("failed to fetch") ||
    m.includes("load failed") ||
    m.startsWith("loading chunk") ||
    m.startsWith("loading css chunk") ||
    m.includes("cancelled") ||
    m.includes("aborted")
  );
};

const prevOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (typeof message === "string" && message.includes("ResizeObserver loop")) {
    return true; // Suppress this specific error
  }
  const resolvedMessage = String(
    (error && error.message) || message || "window.onerror"
  );
  if (isTransientNetworkError(resolvedMessage)) {
    return prevOnError
      ? prevOnError(message, source, lineno, colno, error)
      : false;
  }
  try {
    reportClientError({
      message: resolvedMessage,
      stack: (error && error.stack) || `${source}:${lineno}:${colno}`,
      endpoint: window.location.pathname,
    });
  } catch (_) {}
  return prevOnError
    ? prevOnError(message, source, lineno, colno, error)
    : false;
};

window.addEventListener("unhandledrejection", (event) => {
  try {
    const reason = event && event.reason;
    const message = String(
      (reason && reason.message) || reason || "unhandledrejection"
    );
    if (isTransientNetworkError(message)) return;
    reportClientError({
      message,
      stack: (reason && reason.stack) || "",
      endpoint: window.location.pathname,
    });
  } catch (_) {}
});

moment.locale(i18n.language);
dayjs.locale(i18n.language);

const root = createRoot(document.getElementById("root"));
root.render(
  <Provider store={store}>
    <ProvideAuth>
      <Suspense>
        <ErrorBoundary>
          <OfflineBanner />
          <App />
        </ErrorBoundary>
      </Suspense>
    </ProvideAuth>
  </Provider>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
