import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDisplayLanguages, getDisplaySpecializations } from "utils/api";

export const fetchOptions = createAsyncThunk(
  "options/fetchOptions",
  async (_, { rejectWithValue }) => {
    try {
      const specializations = await getDisplaySpecializations();
      const languages = await getDisplayLanguages();
      return { specializations: specializations || [], languages: languages || [] };
    } catch (error) {
      console.error(error);
      return rejectWithValue(error.message);
    }
  }
);

export const optionsSlice = createSlice({
  name: "options",
  initialState: {
    specializations: [],
    languages: [],
    status: "idle",
    error: null
  },
  reducers: {
    resetOptions(state) {
      state.specializations = [];
      state.languages = [];
      state.error = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchOptions.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchOptions.fulfilled, (state, action) => {
        state.status = "succeeded";
        state.languages = action.payload.languages;
        state.specializations = action.payload.specializations;
        state.error = null;
      })
      .addCase(fetchOptions.rejected, (state, action) => {
        state.status = "failed";
        state.error = action.payload;
        state.languages = [];
        state.specializations = [];
      });
  },
});

export const { resetOptions } = optionsSlice.actions;

export default optionsSlice.reducer;
