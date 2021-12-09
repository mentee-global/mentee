import { configureStore } from "@reduxjs/toolkit";
import userReducer from "../features/user/userSlice";

import notificationsReducer from "../features/notificationsSlice";

export default configureStore({
  reducer: {
    user: userReducer,
    notifications: notificationsReducer,
  },
});
