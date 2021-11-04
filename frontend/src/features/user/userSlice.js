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
    user: {},
    status: "idle",
  },
  reducers: {
    increment: (state) => {
      // Redux Toolkit allows us to write "mutating" logic in reducers. It
      // doesn't actually mutate the state because it uses the immer library,
      // which detects changes to a "draft state" and produces a brand new
      // immutable state based off those changes
      state.value += 1;
    },
    decrement: (state) => {
      state.value -= 1;
    },
    incrementByAmount: (state, action) => {
      state.value += action.payload;
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

export default userSlice.reducer;
