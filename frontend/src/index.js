import React, { Suspense } from "react";
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
import i18n from "utils/i18n";
import { ProvideAuth } from "utils/hooks/useAuth";
import ErrorBoundary from "components/ErrorBoundary";
import { reportClientError } from "utils/errorReport";

// Suppress ResizeObserver loop error (harmless browser/React warning) and
// report everything else to the backend so we know when users hit crashes.
const prevOnError = window.onerror;
window.onerror = (message, source, lineno, colno, error) => {
  if (typeof message === "string" && message.includes("ResizeObserver loop")) {
    return true; // Suppress this specific error
  }
  try {
    reportClientError({
      message: String((error && error.message) || message || "window.onerror"),
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
    reportClientError({
      message: String(
        (reason && reason.message) || reason || "unhandledrejection"
      ),
      stack: (reason && reason.stack) || "",
      endpoint: window.location.pathname,
    });
  } catch (_) {}
});

moment.locale(i18n.language);
dayjs.locale(i18n.language);

const root = createRoot(document.getElementById("root"));
root.render(
  <React.StrictMode>
    <Provider store={store}>
      <ProvideAuth>
        <Suspense>
          <ErrorBoundary>
            <App />
          </ErrorBoundary>
        </Suspense>
      </ProvideAuth>
    </Provider>
  </React.StrictMode>
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
