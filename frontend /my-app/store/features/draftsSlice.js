import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

// ── Async Thunks ─────────────────────────────────────────

export const fetchLeads = createAsyncThunk('drafts/fetchLeads', async (authData) => {
  const response = await axios.get(`${API_BASE}/salesforce/leads`, {
    headers: {
      'access-token': authData.token,
      'instance-url': authData.url,
    },
  });
  return response.data.leads;
});

export const searchLeadByEmail = createAsyncThunk('drafts/searchLeadByEmail', async ({ authData, email }) => {
  const response = await axios.get(`${API_BASE}/salesforce/search/email/${encodeURIComponent(email)}`, {
    headers: {
      'access-token': authData.token,
      'instance-url': authData.url,
    },
  });
  return response.data.lead;
});

export const downloadProposal = createAsyncThunk('drafts/downloadProposal', async (payload) => {
  const response = await axios.post(`${API_BASE}/agent/export-pdf`, payload, {
    responseType: 'blob',
  });
  const url  = window.URL.createObjectURL(new Blob([response.data]));
  const link = document.createElement('a');
  link.href  = url;
  link.setAttribute('download', `Proposal_${payload.lead_name}.pdf`);
  document.body.appendChild(link);
  link.click();
  link.remove();
});

// ── Slice ────────────────────────────────────────────────

const draftsSlice = createSlice({
  name: 'drafts',
  initialState: {
    items:           [],       // leads from Salesforce
    selectedLead:    null,     // currently active lead
    logs:            [],       // thought console entries
    streamingStatus: 'idle',   // 'idle' | 'loading'
    finalProposal:   '',       // generated proposal text
    status:          'idle',   // fetch status
    error:           null,
    qualityScore:    null,     // proposal quality score 1-100
    successProbability: null,  // success probability percentage
    scoringFeedback: null,    // scoring agent feedback
  },
  reducers: {
    addLog: (state, action) => {
      state.logs.push(action.payload);
    },
    clearLogs: (state) => {
      state.logs = [];
    },
    setStreamingStatus: (state, action) => {
      state.streamingStatus = action.payload;
    },
    setFinalProposal: (state, action) => {
      state.finalProposal = action.payload;
    },
    setSelectedLead: (state, action) => {
      state.selectedLead = action.payload;
    },
    setScoringData: (state, action) => {
      state.qualityScore = action.payload.qualityScore;
      state.successProbability = action.payload.successProbability;
      state.scoringFeedback = action.payload.scoringFeedback;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLeads.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLeads.fulfilled, (state, action) => {
        state.status       = 'succeeded';
        state.items        = action.payload;
        state.selectedLead = action.payload[0] || null; // auto-select first
      })
      .addCase(fetchLeads.rejected, (state, action) => {
        state.status = 'failed';
        state.error  = action.error.message;
      })
      .addCase(searchLeadByEmail.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(searchLeadByEmail.fulfilled, (state, action) => {
        state.status = 'succeeded';
        if (action.payload) {
          state.selectedLead = action.payload;
          // Add to items list if not already present
          const existingIndex = state.items.findIndex(item => item.Id === action.payload.Id);
          if (existingIndex === -1) {
            state.items.unshift(action.payload);
          }
        } else {
          state.selectedLead = null;
        }
      })
      .addCase(searchLeadByEmail.rejected, (state, action) => {
        state.status = 'failed';
        state.error  = action.error.message;
        state.selectedLead = null;
      });
  },
});

export const {
  addLog,
  clearLogs,
  setStreamingStatus,
  setFinalProposal,
  setSelectedLead,
  setScoringData,
} = draftsSlice.actions;

export { searchLeadByEmail };

export default draftsSlice.reducer;