import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAccountById, getAdmin, editAccountProfile } from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";

export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async ({ id, role }) => {
    const isAdmin = Number(role) === ACCOUNT_TYPE.ADMIN;
    const res = isAdmin ? await getAdmin(id) : await fetchAccountById(id, role);
    return res;
  }
);

export const updateAndFetchUser = createAsyncThunk(
  "user/updateUser",
  async ({ data, id, role }, thunkAPI) => {
    const res = await editAccountProfile(data, id, role);
    thunkAPI.dispatch(fetchUser({ id, role }));
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
        state.user = action.payload;
      })
      .addCase(updateAndFetchUser.fulfilled, (state, action) => {});
  },
});

export const { resetUser } = userSlice.actions;

export default userSlice.reducer;
