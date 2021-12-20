import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getUnreadDMCount } from "utils/api";

export const fetchNotificationsCount = createAsyncThunk(
  "fetchNotificationsCount",
  async ({ id }) => {
    const res = await getUnreadDMCount(id);
    return res.notifications;
  }
);

export const notificationsSlice = createSlice({
  name: "notifications",
  initialState: {
    count: 0,
    status: "idle",
  },
  reducers: {
    resetNotifications(state, action) {
      state.count = 0;
    },
    decrement: (state, action) => state.count - action.payload,
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

export const { resetNotifications, decrement } = notificationsSlice.actions;

export default notificationsSlice.reducer;
