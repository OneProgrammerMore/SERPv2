import { configureStore } from "@reduxjs/toolkit";
import emergenciesReducer from "./slices/emergenciesSlice";
import resourcesReducer from "./slices/resourcesSlice";
import alertsReducer from "./slices/alertsSlice";
import uiReducer from "./slices/uiSlice";
import batteryReducer from "./slices/batterySlice";

export const store = configureStore({
  reducer: {
    emergencies: emergenciesReducer,
    resources: resourcesReducer,
    alerts: alertsReducer,
    ui: uiReducer,
    battery: batteryReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});
