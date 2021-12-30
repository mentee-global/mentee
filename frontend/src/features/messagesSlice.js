import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

/**
 * Messages
 * - Initialize the socket **
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
    activeMessageId: null,
  },
  reducers: {
    setActiveMessageId(state, action) {
      state.activeMessageId = action.payload;
    },
  },
});

export const { setActiveMessageId } = messagesSlice.actions;

export default messagesSlice.reducer;
