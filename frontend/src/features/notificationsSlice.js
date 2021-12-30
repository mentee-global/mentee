import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUnreadDMCount, updateUnreadDMCount } from "utils/api";

export const fetchNotificationsCount = createAsyncThunk(
  "fetchNotificationsCount",
  async ({ id }) => {
    const res = await getUnreadDMCount(id);
    return res.notifications;
  }
);

// TODO: Make this so that if it fails it should rerun
export const updateNotificationsCount = createAsyncThunk(
  "updateNotificationsCount",
  async ({ recipient, sender }, thunkAPI) => {
    const res = await updateUnreadDMCount(recipient, sender);
    thunkAPI.dispatch(fetchNotificationsCount({ id: recipient }));
    return;
  }
);

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    count: 0,
    status: "idle",
  },
  reducers: {
    notificationIncrement(state, action) {
      state.count = state.count + 1;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchNotificationsCount.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchNotificationsCount.fulfilled, (state, action) => {
        state.count = action.payload;
        state.status = "succeeded";
      });
  },
});

export const { notificationIncrement } = notificationsSlice.actions;

export default notificationsSlice.reducer;
