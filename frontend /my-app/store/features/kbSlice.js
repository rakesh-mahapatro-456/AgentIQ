import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/kb`;

export const uploadDocument = createAsyncThunk('kb/upload', async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await axios.post(`${API_BASE}/ingest`, formData);
  return response.data;
});

export const wipeKB = createAsyncThunk('kb/clear', async () => {
  const response = await axios.delete(`${API_BASE}/clear`);
  return response.data;
});

const kbSlice = createSlice({
  name: 'kb',
  initialState: { isIngesting: false, message: '' },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(uploadDocument.pending, (state) => { state.isIngesting = true; })
      .addCase(uploadDocument.fulfilled, (state, action) => {
        state.isIngesting = false;
        state.message = action.payload.message;
      });
  }
});

export default kbSlice.reducer;