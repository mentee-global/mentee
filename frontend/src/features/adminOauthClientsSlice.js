import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import {
  fetchOAuthClients,
  fetchOAuthClient,
  createOAuthClient,
  updateOAuthClient,
  rotateOAuthClientSecret,
  revokeOAuthClientTokens,
} from "utils/api";

export const fetchAll = createAsyncThunk(
  "adminOauthClients/fetchAll",
  async () => fetchOAuthClients()
);

export const fetchOne = createAsyncThunk(
  "adminOauthClients/fetchOne",
  async (clientId) => fetchOAuthClient(clientId)
);

export const createClient = createAsyncThunk(
  "adminOauthClients/create",
  async (payload) => createOAuthClient(payload)
);

export const updateClient = createAsyncThunk(
  "adminOauthClients/update",
  async ({ clientId, payload }) => {
    const updated = await updateOAuthClient(clientId, payload);
    return updated;
  }
);

export const rotateSecret = createAsyncThunk(
  "adminOauthClients/rotateSecret",
  async (clientId) => rotateOAuthClientSecret(clientId)
);

export const revokeAllTokens = createAsyncThunk(
  "adminOauthClients/revokeAllTokens",
  async (clientId) => {
    const res = await revokeOAuthClientTokens(clientId);
    return { clientId, ...res };
  }
);

const indexById = (list) => {
  const byId = {};
  for (const c of list) {
    byId[c.client_id] = c;
  }
  return byId;
};

// Secrets live ONLY in memory on this slice. Never persisted, never
// serialized, never replayed after the modal closes.
const adminOauthClientsSlice = createSlice({
  name: "adminOauthClients",
  initialState: {
    list: [],
    byId: {},
    loading: false,
    error: null,
    lastCreatedSecret: null,
    lastCreatedClientId: null,
  },
  reducers: {
    clearLastCreatedSecret(state) {
      state.lastCreatedSecret = null;
      state.lastCreatedClientId = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAll.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAll.fulfilled, (state, action) => {
        state.loading = false;
        state.list = action.payload || [];
        state.byId = indexById(state.list);
      })
      .addCase(fetchAll.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error?.message || "failed to load clients";
      })
      .addCase(fetchOne.fulfilled, (state, action) => {
        const client = action.payload;
        if (client) {
          state.byId[client.client_id] = client;
        }
      })
      .addCase(createClient.fulfilled, (state, action) => {
        const payload = action.payload || {};
        const client = payload.client;
        const secret = payload.client_secret;
        if (client) {
          state.byId[client.client_id] = client;
          const idx = state.list.findIndex(
            (c) => c.client_id === client.client_id
          );
          if (idx >= 0) {
            state.list[idx] = client;
          } else {
            state.list.unshift(client);
          }
        }
        if (secret && client) {
          state.lastCreatedSecret = secret;
          state.lastCreatedClientId = client.client_id;
        }
      })
      .addCase(updateClient.fulfilled, (state, action) => {
        const client = action.payload;
        if (client) {
          state.byId[client.client_id] = client;
          const idx = state.list.findIndex(
            (c) => c.client_id === client.client_id
          );
          if (idx >= 0) state.list[idx] = client;
        }
      })
      .addCase(rotateSecret.fulfilled, (state, action) => {
        const payload = action.payload || {};
        const client = payload.client;
        const secret = payload.client_secret;
        if (client) {
          state.byId[client.client_id] = client;
        }
        if (secret && client) {
          state.lastCreatedSecret = secret;
          state.lastCreatedClientId = client.client_id;
        }
      })
      .addCase(revokeAllTokens.fulfilled, () => {
        // No state change; tokens live in backend. Caller may show a
        // toast based on the fulfilled action.
      });
  },
});

export const { clearLastCreatedSecret } = adminOauthClientsSlice.actions;
export default adminOauthClientsSlice.reducer;
