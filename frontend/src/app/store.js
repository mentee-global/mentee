import { configureStore } from "@reduxjs/toolkit";
import userReducer from "features/userSlice";
import notificationsReducer from "features/notificationsSlice";
import messagesReducer from "features/messagesSlice";
import optionsReducer from "features/optionsSlice";
import meetingPanelReducer from "features/meetingPanelSlice";
import adminOauthClientsReducer from "features/adminOauthClientsSlice";
import connectedAppsReducer from "features/connectedAppsSlice";
import oauthAccessReducer from "features/oauthAccessSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    notifications: notificationsReducer,
    messages: messagesReducer,
    options: optionsReducer,
    meetingPanel: meetingPanelReducer,
    adminOauthClients: adminOauthClientsReducer,
    connectedApps: connectedAppsReducer,
    oauthAccess: oauthAccessReducer,
  },
});
