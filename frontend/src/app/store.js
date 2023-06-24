import { configureStore } from "@reduxjs/toolkit";
import userReducer from "features/userSlice";
import notificationsReducer from "features/notificationsSlice";
import messagesReducer from "features/messagesSlice";
import optionsReducer from "features/optionsSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    notifications: notificationsReducer,
    messages: messagesReducer,
    options: optionsReducer,
  },
});
