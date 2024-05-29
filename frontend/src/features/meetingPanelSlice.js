import { createSlice } from "@reduxjs/toolkit";

const meetingPanelSlice = createSlice({
  name: "meetingPanel",
  initialState: {
    panelComponent: null,
  },
  reducers: {
    setPanel: (state, action) => {
      return {
        ...state,
        panelComponent: action.payload,
      };
    },
    removePanel: (state) => {
      return {
        ...state,
        panelComponent: null,
      };
    },
  },
});

export const { setPanel, removePanel } = meetingPanelSlice.actions;
export default meetingPanelSlice.reducer;
