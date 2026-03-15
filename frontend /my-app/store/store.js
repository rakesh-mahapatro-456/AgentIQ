import { configureStore } from '@reduxjs/toolkit';
import draftsReducer from './features/draftsSlice';
import authReducer from './features/authSlice';
import kbReducer from './features/kbSlice';

export const store = configureStore({
  reducer: {
    drafts: draftsReducer,
    auth: authReducer,
    kb: kbReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false, // Essential for handling non-serializable data like Blobs/Streams
    }),
});