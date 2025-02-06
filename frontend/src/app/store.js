import { configureStore } from "@reduxjs/toolkit";
import userReducer from "features/userSlice";
import notificationsReducer from "features/notificationsSlice";
import messagesReducer from "features/messagesSlice";
import optionsReducer from "features/optionsSlice";
import meetingPanelReducer from "features/meetingPanelSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    notifications: notificationsReducer,
    messages: messagesReducer,
    options: optionsReducer,
    meetingPanel: meetingPanelReducer,
  },
});
