import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAccountById, getAdmin } from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";

export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async ({ id, role }) => {
    console.log(id);
    const isAdmin = role === ACCOUNT_TYPE.ADMIN;
    const res = isAdmin ? await getAdmin(id) : await fetchAccountById(id, role);
    console.log(res);
    return res;
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    status: "idle",
  },
  reducers: {
    resetUser(state, action) {
      state.user = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchUser.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        console.log(action.payload);
        state.user = action.payload;
      });
  },
});

export const { resetUser } = userSlice.actions;

export default userSlice.reducer;
