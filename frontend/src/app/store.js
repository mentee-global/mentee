import { configureStore } from "@reduxjs/toolkit";
import userReducer from "features/userSlice";
import notificationsReducer from "features/notificationsSlice";
import messagesReducer from "features/messagesSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    notifications: notificationsReducer,
    messages: messagesReducer,
  },
});
