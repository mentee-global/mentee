import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { getDisplayLanguages, getDisplaySpecializations } from "utils/api";

export const fetchOptions = createAsyncThunk(
  "options/fetchOptions",
  async () => {
    const specializations = await getDisplaySpecializations();
    const languages = await getDisplayLanguages();
    return { specializations, languages };
  }
);

export const optionsSlice = createSlice({
  name: "options",
  initialState: {
    specializations: null,
    languages: null,
    status: "idle",
  },
  reducers: {
    resetOptions(state, action) {
      state.specializations = null;
      state.languages = null;
    },
  },
  extraReducers(builder) {
    builder
      .addCase(fetchOptions.pending, (state, action) => {
        state.status = "loading";
      })
      .addCase(fetchOptions.fulfilled, (state, action) => {
        state.status = "succeeded";
        const payload = action.payload;
        state.languages = payload.languages;
        state.specializations = payload.specializations;
      });
  },
});

export const { resetOptions } = optionsSlice.actions;

export default optionsSlice.reducer;
