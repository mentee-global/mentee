import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchAccountById, getAdmin, editAccountProfile } from "utils/api";
import { ACCOUNT_TYPE } from "utils/consts";

export const fetchUser = createAsyncThunk(
  "user/fetchUser",
  async ({ id, role }) => {
    const isAdmin = parseInt(role) === ACCOUNT_TYPE.ADMIN;
    const res = isAdmin ? await getAdmin(id) : await fetchAccountById(id, role);

    return { user: res, role: parseInt(role) };
  }
);

export const updateAndFetchUser = createAsyncThunk(
  "user/updateUser",
  async ({ data, id, role }, thunkAPI) => {
    await editAccountProfile(data, id, role);
    thunkAPI.dispatch(fetchUser({ id, role }));
  }
);

export const userSlice = createSlice({
  name: "user",
  initialState: {
    user: null,
    role: null,
    collapsed: false,
    status: "idle",
  },
  reducers: {
    resetUser(state, action) {
      state.user = null;
      state.role = null;
    },
    collapse(state, action) {
      state.collapsed = !state.collapsed;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchUser.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchUser.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.user = action.payload?.user;
        state.role = action.payload?.role;
      })
      // fetchUser handles this hence we don't need to do anything
      .addCase(updateAndFetchUser.fulfilled, (state, action) => {});
  },
});

export const { resetUser, collapse } = userSlice.actions;

export default userSlice.reducer;
