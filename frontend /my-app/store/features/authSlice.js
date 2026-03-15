import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    token: null,
    instanceUrl: null,
    refreshToken: null,
    isAuthenticated: false,
    user: null, // Add user information
  },
  reducers: {
    setAuth: (state, action) => {
      state.token = action.payload.token;
      state.instanceUrl = action.payload.instanceUrl;
      state.refreshToken = action.payload.refreshToken;
      state.isAuthenticated = action.payload.isAuthenticated;
      state.user = action.payload.user || null;
    },
    setCredentials: (state, action) => {
      state.token = action.payload.token;
      state.instanceUrl = action.payload.instanceUrl;
      state.isAuthenticated = true;
      state.user = action.payload.user || null;
    },
    setUser: (state, action) => {
      state.user = action.payload;
    },
    logout: (state) => {
      state.token = null;
      state.instanceUrl = null;
      state.refreshToken = null;
      state.isAuthenticated = false;
      state.user = null;
    }
  }
});

export const { setAuth, setCredentials, setUser, logout } = authSlice.actions;
export default authSlice.reducer;