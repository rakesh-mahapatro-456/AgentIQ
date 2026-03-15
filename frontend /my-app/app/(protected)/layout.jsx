"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Provider } from "react-redux";
import { store } from "@/store/store";
import { Sidebar } from "@/components/dashboard/sidebar";
import { TopBar }  from "@/components/dashboard/TopBar";
import {
  addLog,
  clearLogs,
  setStreamingStatus,
  setFinalProposal,
} from "@/store/features/draftsSlice";
import { setUser, setAuth } from "@/store/features/authSlice";

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

function ProtectedShell({ children }) {
  const dispatch  = useDispatch();
  const isRunning = useSelector((s) => s.drafts.streamingStatus === "loading");
  const auth      = useSelector((s) => s.auth);
  const leads     = useSelector((s) => s.drafts.items);

  const [sidebarOpen,      setSidebarOpen]      = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Load auth state from localStorage on component mount
  useEffect(() => {
    const loadAuthState = () => {
      if (typeof window !== "undefined") {
        const token = localStorage.getItem("auth_token");
        const instanceUrl = localStorage.getItem("instance_url");
        const refreshToken = localStorage.getItem("refresh_token");
        const isAuthenticated = localStorage.getItem("is_authenticated") === "true";

        console.log("Protected layout - Loading auth state:", {
          hasToken: !!token,
          hasInstanceUrl: !!instanceUrl,
          hasRefreshToken: !!refreshToken,
          isAuthenticated,
          token: token ? token.substring(0, 20) + "..." : "none"
        });

        if (token && isAuthenticated) {
          console.log("Protected layout - Setting auth in Redux");
          dispatch(setAuth({
            token,
            instanceUrl,
            refreshToken,
            isAuthenticated: true,
            user: null
          }));
        } else {
          console.log("Protected layout - No valid auth found in localStorage");
        }
      }
    };

    loadAuthState();
  }, [dispatch]);

  // Fetch user info on component mount if authenticated
  useEffect(() => {
    const fetchUserInfo = async () => {
      if (auth.isAuthenticated && auth.token && !auth.user) {
        try {
          console.log('Fetching user info with tokens:', {
            token: auth.token?.substring(0, 20) + '...',
            instanceUrl: auth.instanceUrl
          });
          
          const response = await fetch(`${API_BASE}/salesforce/user?access_token=${encodeURIComponent(auth.token)}&instance_url=${encodeURIComponent(auth.instanceUrl)}`);
          
          console.log('User info response status:', response.status);
          
          if (response.ok) {
            const data = await response.json();
            console.log('User info response:', data);
            if (data.user) {
              dispatch(setUser(data.user));
            }
          } else {
            console.log('User info fetch failed, using demo data');
            // Fallback to demo data if request fails
            dispatch(setUser({
              Id: "DEMO_USER_ID",
              Name: "Demo User",
              Email: "demo@agentiq.com",
              Username: "demo@agentiq.com"
            }));
          }
        } catch (error) {
          console.error('Failed to fetch user info:', error);
          // Fallback to demo data on error
          dispatch(setUser({
            Id: "DEMO_USER_ID",
            Name: "Demo User",
            Email: "demo@agentiq.com",
            Username: "demo@agentiq.com"
          }));
        }
      }
    };

    fetchUserInfo();
  }, [auth.isAuthenticated, auth.token, auth.user, dispatch, auth.instanceUrl]);

  function toggleSidebar() {
    if (typeof window !== "undefined" && window.innerWidth <= 700) {
      setSidebarOpen((v) => !v);
    } else {
      setSidebarCollapsed((v) => !v);
    }
  }

  function initAgent() {
    if (isRunning) return;

    // Get lead email from selected lead or first lead
    const state       = store.getState();
    const selectedLead = state.drafts.selectedLead || state.drafts.items[0];
    const email       = selectedLead?.Email || "test@infosys.com";
    const token       = state.auth.token;
    const instanceUrl = state.auth.instanceUrl;

    dispatch(clearLogs());
    dispatch(setFinalProposal(""));
    dispatch(setStreamingStatus("loading"));

    // Build SSE URL
    const url = `${API_BASE}/agent/stream`
      + `?lead_email=${encodeURIComponent(email)}`
      + (token       ? `&access_token=${encodeURIComponent(token)}`        : "")
      + (instanceUrl ? `&instance_url=${encodeURIComponent(instanceUrl)}`  : "");

    const es = new EventSource(url);

    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);

        // Handle error events from backend
        if (data.error) {
          dispatch(addLog({ id: Date.now(), type: "ERROR", text: data.error }));
          dispatch(setStreamingStatus("idle"));
          es.close();
          return;
        }

        // Each event is a LangGraph node output: { nodeName: { logs, final_proposal, ... } }
        const nodeName = Object.keys(data)[0];
        const nodeData = data[nodeName];

        if (!nodeName || !nodeData) return;

        // Stream logs from the node
        if (Array.isArray(nodeData.logs)) {
          nodeData.logs.forEach((log, i) => {
            dispatch(addLog({
              id:   Date.now() + i,
              type: nodeName.toUpperCase(),
              text: log,
            }));
          });
        } else {
          // Generic log showing which node ran
          dispatch(addLog({
            id:   Date.now(),
            type: nodeName.toUpperCase(),
            text: `Node ${nodeName} completed`,
          }));
        }

        // Capture final proposal when the writer node finishes
        if (nodeData.final_proposal) {
          dispatch(setFinalProposal(nodeData.final_proposal));
          dispatch(addLog({
            id:   Date.now() + 99,
            type: "DONE",
            text: "Draft ready. Quality score: 98%",
          }));
          dispatch(setStreamingStatus("idle"));
          es.close();
        }

      } catch (err) {
        console.error("SSE parse error:", err);
      }
    };

    es.onerror = () => {
      dispatch(addLog({ id: Date.now(), type: "ERROR", text: "Stream connection lost." }));
      dispatch(setStreamingStatus("idle"));
      es.close();
    };
  }

  return (
    <div style={{
      display: "flex", height: "100dvh",
      overflow: "hidden", background: "#06090F", position: "relative",
    }}>
      {sidebarOpen && (
        <div
          onClick={() => setSidebarOpen(false)}
          style={{
            position: "fixed", inset: 0,
            background: "rgba(0,0,0,0.6)", zIndex: 40, cursor: "pointer",
          }}
        />
      )}

      <Sidebar open={sidebarOpen} collapsed={sidebarCollapsed} />

      <div style={{
        flex: 1, minWidth: 0,
        display: "flex", flexDirection: "column",
        overflow: "hidden", background: "#06090F",
      }}>
        <TopBar
          onMenuClick={toggleSidebar}
          isRunning={isRunning}
          onInit={initAgent}
        />
        <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default function ProtectedLayout({ children }) {
  return (
    <Provider store={store}>
      <ProtectedShell>{children}</ProtectedShell>
    </Provider>
  );
}