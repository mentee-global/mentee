import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { io } from "socket.io-client";
import { BASE_URL } from "utils/consts";

/**
 * Messages
 * - Initialize the socket
 * - Event Reconnect: Dispatch refetch of notifications
 * - Event New Message: If we are not on the specific chat, add one to notificationsSlice
 */

// // TODO: Make this so that if it fails it should rerun
// export const updateNotificationsCount = createAsyncThunk(
//   "updateNotificationsCount",
//   async ({ recipient, sender }, thunkAPI) => {
//     const res = await updateUnreadDMCount(recipient, sender);
//     thunkAPI.dispatch(fetchNotificationsCount({ id: recipient }));
//     return res;
//   }
// );

export const messagesSlice = createSlice({
  name: "messages",
  initialState: {
    socket: null,
  },
  reducers: {
    createSocket(state, action) {
      state.socket = io(BASE_URL);
    },
    destroySocket: (state, action) => {
      state.socket.close();
      state.socket = null;
    },
  },
});

export const { createSocket, destroySocket } = messagesSlice.actions;

export default messagesSlice.reducer;
