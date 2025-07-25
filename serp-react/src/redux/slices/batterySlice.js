import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const getBatteryStatus = createAsyncThunk(
  "battery/getBatteryStatus",
  async () => {
    if (!navigator.getBattery) {
      throw new Error("Battery API not supported");
    }

    const battery = await navigator.getBattery(); // Make sure this line executes
    return {
      level: battery.level,
      charging: battery.charging,
    };
  },
);

// Then in the slice:
const batterySlice = createSlice({
  name: "battery",
  initialState: {
    level: "NA",
    charging: "",
    status: "idle",
  },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getBatteryStatus.fulfilled, (state, action) => {
        state.level = action.payload.level;
        state.charging = action.payload.charging;
        state.status = "succeeded";
      })
      .addCase(getBatteryStatus.pending, (state) => {
        state.level = "NA";
        state.status = "loading";
      })
      .addCase(getBatteryStatus.rejected, (state) => {
        state.level = "NA";
        state.status = "failed";
      });
  },
});

// export const { setActiveResource, clearActiveResource } = resourcesSlice.actions;

export default batterySlice.reducer;
