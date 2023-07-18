import React, { Suspense } from "react";
import ReactDOM from "react-dom";
import "./index.scss";
import App from "app/App";
import * as serviceWorker from "utils/serviceWorker";
import { Provider } from "react-redux";
import store from "./app/store";
import moment from "moment";
import "moment/locale/es";
import "moment/locale/ar";
import "moment/locale/fa";
import "moment/locale/pt";
import i18n from "utils/i18n";
import { ProvideAuth } from "utils/hooks/useAuth";
import { ConfigProvider } from "antd";

moment.locale(i18n.language);

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
