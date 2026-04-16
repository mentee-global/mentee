import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { fetchConnectedApps, revokeConnectedApp } from "utils/api";

export const fetchAllConnectedApps = createAsyncThunk(
  "connectedApps/fetchAll",
  async () => fetchConnectedApps()
);

export const revokeApp = createAsyncThunk(
  "connectedApps/revoke",
  async (clientId, thunkAPI) => {
    try {
      await revokeConnectedApp(clientId);
      return clientId;
    } catch (err) {
      // Refetch so the UI reflects authoritative server state after a failed
      // optimistic remove.
      thunkAPI.dispatch(fetchAllConnectedApps());
      throw err;
    }
  }
);

const connectedAppsSlice = createSlice({
  name: "connectedApps",
  initialState: {
    list: [],
    loading: false,
    error: null,
  },
  reducers: {
    optimisticRemove(state, action) {
      const clientId = action.payload;
      state.list = state.list.filter((c) => c.client_id !== clientId);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllConnectedApps.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllConnectedApps.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
      })
      .addCase(fetchAllConnectedApps.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "failed to load connected apps";
      })
      .addCase(revokeApp.fulfilled, (state, action) => {
        const clientId = action.payload;
        state.list = state.list.filter((c) => c.client_id !== clientId);
      });
  },
});

export const { optimisticRemove } = connectedAppsSlice.actions;
export default connectedAppsSlice.reducer;
