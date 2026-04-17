import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchOAuthHasAny } from "utils/api";

export const fetchHasOauthAccess = createAsyncThunk(
  "oauthAccess/fetchHasAny",
  async () => fetchOAuthHasAny()
);

const oauthAccessSlice = createSlice({
  name: "oauthAccess",
  initialState: {
    hasAny: false,
    loaded: false,
    loading: false,
  },
  reducers: {
    resetOauthAccess(state) {
      state.hasAny = false;
      state.loaded = false;
      state.loading = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchHasOauthAccess.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchHasOauthAccess.fulfilled, (state, action) => {
        state.loading = false;
        state.loaded = true;
        state.hasAny = Boolean(action.payload);
      })
      .addCase(fetchHasOauthAccess.rejected, (state) => {
        state.loading = false;
        state.loaded = true;
        state.hasAny = false;
      });
  },
});

export const { resetOauthAccess } = oauthAccessSlice.actions;
export default oauthAccessSlice.reducer;
