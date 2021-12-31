import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

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
