import React, { Suspense } from "react";
import ReactDOM from "react-dom";
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

moment.locale(i18n.language);
dayjs.locale(i18n.language);

ReactDOM.render(
  <React.StrictMode>
    <Provider store={store}>
      <ProvideAuth>
        <Suspense>
          <App />
        </Suspense>
      </ProvideAuth>
    </Provider>
  </React.StrictMode>,
  document.getElementById("root")
);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
