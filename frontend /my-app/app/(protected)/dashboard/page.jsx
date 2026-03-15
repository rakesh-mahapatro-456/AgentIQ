"use client";
import { useRef, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useSearchParams } from "next/navigation";
import {
  Search, Database, Zap,
  CheckCircle, RefreshCcw, Download,
} from "lucide-react";
import {
  fetchLeads,
  searchLeadByEmail,
  downloadProposal,
  setSelectedLead,
  clearLogs,
  setFinalProposal,
} from "@/store/features/draftsSlice";
import { setCredentials } from "@/store/features/authSlice";
import { KnowledgeBase } from "@/components/dashboard/KnowledgeBase";

/* ─── Card ──────────────────────────────────────────────── */
function Card({ children }) {
  return (
    <>
      <div className="aiq-card">{children}</div>
      <style jsx>{`
        .aiq-card {
          background: var(--bg2);
          border: 1px solid var(--border);
          border-radius: 12px;
          overflow: hidden;
        }
      `}</style>
    </>
  );
}

/* ─── Log entry ──────────────────────────────────────────── */
function LogEntry({ type, text }) {
  return (
    <>
      <div className="log-item">
        <span className="log-badge">[{type}]</span>
        <span className="log-text">{text}</span>
      </div>
      <style jsx>{`
        .log-item { display:flex; align-items:flex-start; gap:8px; animation:fadeUp 0.3s ease; }
        @keyframes fadeUp { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:none} }
        .log-badge {
          font-size:8px; font-weight:700; font-family:monospace;
          color:#a1a1aa; background:rgba(255,255,255,0.05);
          border:1px solid var(--border2); padding:2px 5px; border-radius:4px;
          white-space:nowrap; flex-shrink:0; margin-top:1px;
        }
        .log-text { font-family:monospace; font-size:11px; color:#a1a1aa; line-height:1.6; }
      `}</style>
    </>
  );
}

/* ─── Page ───────────────────────────────────────────────── */
export default function DashboardPage() {
  const dispatch      = useDispatch();
  const searchParams  = useSearchParams();
  const [searchEmail, setSearchEmail] = useState("");

  // Redux state
  const auth          = useSelector((s) => s.auth);
  const logs          = useSelector((s) => s.drafts.logs);
  const isRunning     = useSelector((s) => s.drafts.streamingStatus === "loading");
  const leads         = useSelector((s) => s.drafts.items);
  const selectedLead  = useSelector((s) => s.drafts.selectedLead);
  const finalProposal = useSelector((s) => s.drafts.finalProposal);
  const fetchStatus   = useSelector((s) => s.drafts.status);
  const qualityScore  = useSelector((s) => s.drafts.qualityScore);
  const successProbability = useSelector((s) => s.drafts.successProbability);
  const scoringFeedback = useSelector((s) => s.drafts.scoringFeedback);

  const logRef = useRef(null);

  // ── On mount: grab OAuth code from URL and store credentials ──
  useEffect(() => {
    const code = searchParams.get("code");
    if (code && !auth.isAuthenticated) {
      // In production exchange code for real token via your backend
      // For now store the code as token placeholder
      dispatch(setCredentials({
        token:       code,
        instanceUrl: process.env.NEXT_PUBLIC_SF_INSTANCE_URL || "",
      }));
    }
  }, []);

  // ── Auto-scroll logs ──
  useEffect(() => {
    if (logRef.current)
      logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  // ── Fetch CRM ──
  function handleFetchCRM() {
    dispatch(fetchLeads({ token: auth.token, url: auth.instanceUrl }));
  }

  // ── Search by Email ──
  function handleSearchByEmail() {
    if (!searchEmail.trim()) {
      // If no email entered, fetch all leads
      handleFetchCRM();
      return;
    }
    
    dispatch(searchLeadByEmail({ 
      authData: { token: auth.token, url: auth.instanceUrl }, 
      email: searchEmail.trim() 
    })).then((result) => {
      if (result.meta.requestStatus === 'fulfilled' && !result.payload) {
        // Clear search email if no lead found to avoid confusion
        setSearchEmail('');
      }
    });
  }

  // ── Handle Enter key in search input ──
  function handleSearchKeyPress(e) {
    if (e.key === 'Enter') {
      handleSearchByEmail();
    }
  }

  // ── Initialize Agent ──
  function initializeAgent() {
    if (!searchEmail.trim()) {
      alert('Please enter an email address first');
      return;
    }

    dispatch(setStreamingStatus('loading'));
    dispatch(clearLogs());
    dispatch(setFinalProposal(''));
    dispatch(setScoringData({ qualityScore: null, successProbability: null, scoringFeedback: null }));

    const eventSource = new EventSource(
      `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/agent/stream?lead_email=${encodeURIComponent(searchEmail.trim())}&access_token=${auth.token}&instance_url=${auth.instanceUrl}`
    );

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        
        if (data.logs) {
          data.logs.forEach(log => {
            dispatch(addLog({
              id: Date.now() + Math.random(),
              type: 'INFO',
              text: log
            }));
          });
        }

        if (data.final_proposal) {
          dispatch(setFinalProposal(data.final_proposal));
        }

        if (data.quality_score !== undefined) {
          dispatch(setScoringData({
            qualityScore: data.quality_score,
            successProbability: data.success_probability,
            scoringFeedback: data.scoring_feedback
          }));
        }

        if (data.error) {
          console.error('Agent error:', data.error);
          dispatch(addLog({
            id: Date.now() + Math.random(),
            type: 'ERROR',
            text: `❌ Error: ${data.error}`
          }));
        }
      } catch (error) {
        console.error('Error parsing SSE data:', error);
      }
    };

    eventSource.onerror = (error) => {
      console.error('EventSource error:', error);
      dispatch(setStreamingStatus('idle'));
      dispatch(addLog({
        id: Date.now() + Math.random(),
        type: 'ERROR',
        text: '❌ Connection error. Please check your connection.'
      }));
    };

    eventSource.onopen = () => {
      console.log('EventSource connected');
      dispatch(addLog({
        id: Date.now() + Math.random(),
        type: 'DISCOVERY',
        text: '🚀 Agent initialized and starting research...'
      }));
    };

    // Handle cleanup
    return () => {
      eventSource.close();
    };
  }

  // ── Regen: clear and re-run (triggers layout initAgent via Redux) ──
  function handleRegen() {
    dispatch(clearLogs());
    dispatch(setFinalProposal(""));
  }

  // ── Download PDF ──
  function handleDownload() {
    if (!finalProposal) return;
    dispatch(downloadProposal({
      content:   finalProposal,
      lead_name: selectedLead?.Name || "Lead",
    }));
  }

  return (
    <>
      <div className="page-content">

        {/* ══ LEFT COLUMN ══ */}
        <div className="col-left">

          {/* Lead input */}
          <Card>
            <div className="card-body">

              {/* Email search */}
              <div className="search-row">
                <div className="search-wrap">
                  <Search size={14} strokeWidth={2} style={{
                    position:"absolute", left:10, top:"50%",
                    transform:"translateY(-50%)", color:"var(--muted)",
                  }}/>
                  <input
                    className="search-input"
                    placeholder="mark@bensontech.com"
                    value={searchEmail}
                    onChange={(e) => setSearchEmail(e.target.value)}
                    onKeyPress={handleSearchKeyPress}
                  />
                </div>
                <button
                  className="fetch-btn"
                  onClick={initializeAgent}
                  disabled={fetchStatus === "loading"}
                >
                  <Database size={14} strokeWidth={2} style={{ color:"var(--blue)" }}/>
                  <span>{fetchStatus === "loading" ? "Searching…" : "Generate Proposal"}</span>
                </button>
              </div>

              {/* Lead chip */}
              {selectedLead ? (
                <div className="lead-row">
                  <div className="lead-info">
                    <div className="lead-avatar">
                      {(selectedLead.Name || "??").split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <p className="lead-name">{selectedLead.Name || "Unknown"}</p>
                      <p className="lead-role">{selectedLead.Title || "—"} · {selectedLead.Company || "—"}</p>
                    </div>
                  </div>
                  <span className="badge-synced">Lead Synced</span>
                </div>
              ) : (
                <div className="lead-row" style={{ justifyContent: "center", cursor: "default" }}>
                  <p style={{ fontSize: 11, color:"#52525b" }}>
                    {fetchStatus === "failed"
                      ? "Failed to fetch leads. Check your connection."
                      : searchEmail.trim() 
                        ? `No lead found for: ${searchEmail}`
                        : "Enter an email address and click Search to find a lead."}
                  </p>
                </div>
              )}

              {/* Objective */}
              <div>
                <p className="field-label">Custom Objective</p>
                <textarea
                  className="obj-textarea"
                  defaultValue="Focus on security encryption and SOC 2 compliance for their fintech requirements. Emphasize our recent ROI with similar sized firms."
                />
              </div>
            </div>
          </Card>

          {/* Thought console */}
          <Card>
            <div className="card-body">
              <div className="console-header">
                <div className="console-left">
                  <span className={`pulse-dot ${isRunning ? "active" : ""}`}/>
                  <span className="section-label">Thought Console</span>
                </div>
                {isRunning && (
                  <div className="agent-active">
                    <span className="agent-pulse"/>
                    Agent Active
                  </div>
                )}
              </div>

              <div className="log-area" ref={logRef}>
                {logs.length === 0 ? (
                  <div className="log-empty">
                    <Zap size={22} strokeWidth={1.5} style={{ opacity:0.2, marginBottom:6 }}/>
                    <p>Initialize agent to start research stream</p>
                  </div>
                ) : (
                  logs.map((log) => (
                    <LogEntry key={log.id} type={log.type} text={log.text}/>
                  ))
                )}
              </div>
            </div>
          </Card>

          {/* Proposal preview */}
          <Card>
            <div className="proposal-header">
              <span className="section-label">Draft Review — Human-in-the-loop</span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <span className="badge-quality">
                  {qualityScore ? `${qualityScore}% Quality Score` : '98% Quality Score'}
                </span>
                {successProbability && (
                  <span className="badge-quality" style={{ 
                    background: successProbability > 60 ? "rgba(34, 197, 94, 0.1)" : "rgba(239, 68, 68, 0.1)",
                    color: successProbability > 60 ? "#22c55e" : "#ef4444"
                  }}>
                    {successProbability}% Success Rate
                  </span>
                )}
              </div>
            </div>
            <div className="proposal-body">
              {finalProposal ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                  {/* Email Section */}
                  <div style={{ 
                    background: "rgba(59, 139, 255, 0.05)", 
                    border: "1px solid rgba(59, 139, 255, 0.2)", 
                    borderRadius: "8px", 
                    padding: "16px" 
                  }}>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      marginBottom: "12px",
                      borderBottom: "1px solid rgba(59, 139, 255, 0.2)",
                      paddingBottom: "8px"
                    }}>
                      <span style={{ 
                        fontSize: "12px", 
                        fontWeight: "700", 
                        color: "#3B8BFF",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>
                        📧 Email Draft
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: "13px", 
                      lineHeight: "1.6", 
                      color: "#e4e4e7",
                      whiteSpace: "pre-wrap"
                    }}>
                      {finalProposal.split("---EMAIL_END---")[0]?.trim() || "Email content not available"}
                    </div>
                  </div>

                  {/* Proposal Section */}
                  <div style={{ 
                    background: "rgba(34, 197, 94, 0.05)", 
                    border: "1px solid rgba(34, 197, 94, 0.2)", 
                    borderRadius: "8px", 
                    padding: "16px" 
                  }}>
                    <div style={{ 
                      display: "flex", 
                      alignItems: "center", 
                      gap: "8px", 
                      marginBottom: "12px",
                      borderBottom: "1px solid rgba(34, 197, 94, 0.2)",
                      paddingBottom: "8px"
                    }}>
                      <span style={{ 
                        fontSize: "12px", 
                        fontWeight: "700", 
                        color: "#22c55e",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em"
                      }}>
                        📄 Formal Proposal
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: "13px", 
                      lineHeight: "1.6", 
                      color: "#e4e4e7",
                      whiteSpace: "pre-wrap"
                    }}>
                      {finalProposal.split("---EMAIL_END---")[1]?.trim() || "Proposal content not available"}
                    </div>
                  </div>
                </div>
              ) : (
                <p style={{ color:"#3f3f46", fontStyle:"italic" }}>
                  Run the agent to generate a proposal…
                </p>
              )}
              
              {/* Scoring Feedback Section */}
              {scoringFeedback && (
                <div style={{ 
                  marginTop: "16px",
                  padding: "12px",
                  background: "rgba(59, 139, 255, 0.05)",
                  border: "1px solid rgba(59, 139, 255, 0.2)",
                  borderRadius: "8px"
                }}>
                  <div style={{ 
                    fontSize: "11px", 
                    fontWeight: "700", 
                    color: "#3B8BFF",
                    marginBottom: "6px",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}>
                    🎯 AI Scoring Feedback
                  </div>
                  <div style={{ 
                    fontSize: "12px", 
                    color: "#e4e4e7", 
                    lineHeight: "1.5"
                  }}>
                    {scoringFeedback}
                  </div>
                </div>
              )}
            </div>
            <div className="proposal-footer">
              <button className="btn-approve">
                <CheckCircle size={13} strokeWidth={2}/>
                Approve &amp; Sync
              </button>
              <button className="btn-regen" onClick={handleRegen}>
                <RefreshCcw size={13} strokeWidth={2}/>
                Regen
              </button>
              <button
                className="btn-dl"
                onClick={handleDownload}
                disabled={!finalProposal}
                title={finalProposal ? "Download PDF" : "Generate a proposal first"}
              >
                <Download size={14} strokeWidth={2}/>
              </button>
            </div>
          </Card>

          {/* Knowledge Base */}
          <KnowledgeBase />
        </div>

        {/* ══ RIGHT COLUMN ══ */}
        <div className="col-right">
          <Card>
            <div className="card-body">
              <p className="section-label" style={{ marginBottom:"12px" }}>Run Statistics</p>
              <div className="stats-grid">
                <div className="stat-tile">
                  <p className="stat-num blue">{leads.length || 0}</p>
                  <p className="stat-sub">Fetched</p>
                </div>
                <div className="stat-tile">
                  <p className="stat-num emerald">
                    {finalProposal ? 1 : 0}
                  </p>
                  <p className="stat-sub">Drafted</p>
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="card-body">
              <p className="section-label" style={{ marginBottom:"12px" }}>Active Model</p>
              <div className="model-row">
                <div className="model-icon">
                  <Zap size={16} style={{ fill:"#a855f7", color:"#a855f7" }}/>
                </div>
                <div>
                  <p className="model-name">Llama 3 70B</p>
                  <p className="model-provider">Provider: Groq</p>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <style jsx>{`
        .page-content {
          display: grid;
          grid-template-columns: 1fr 220px;
          gap: 16px; padding: 20px;
          max-width: 1440px; margin: 0 auto;
        }
        @media (max-width: 900px) { .page-content { grid-template-columns: 1fr; } }
        @media (max-width: 480px) { .page-content { padding: 12px; gap: 12px; } }
        .col-left, .col-right { display:flex; flex-direction:column; gap:16px; }
        .card-body { padding:16px; display:flex; flex-direction:column; gap:12px; }

        .search-row  { display:flex; gap:8px; }
        .search-wrap { position:relative; flex:1; }
        .search-input {
          width:100%; background:rgba(0,0,0,0.4);
          border:1px solid var(--border2); border-radius:8px;
          padding:8px 10px 8px 32px;
          font-size:13px; color:var(--text);
          font-family:var(--font-dm-sans),sans-serif;
          outline:none; height:40px; transition:border-color 0.15s;
        }
        .search-input:focus { border-color:rgba(59,139,255,0.45); }
        .fetch-btn {
          display:flex; align-items:center; gap:6px;
          background:var(--bg3); border:1px solid var(--border2);
          border-radius:8px; color:var(--text);
          font-size:9px; font-weight:700;
          text-transform:uppercase; letter-spacing:0.08em;
          padding:0 14px; height:40px;
          cursor:pointer; white-space:nowrap; transition:background 0.15s;
        }
        .fetch-btn:hover:not(:disabled) { background:rgba(255,255,255,0.06); }
        .fetch-btn:disabled { opacity:0.5; cursor:not-allowed; }

        .lead-row {
          display:flex; align-items:center; justify-content:space-between;
          padding:12px; background:rgba(255,255,255,0.02);
          border:1px solid var(--border); border-radius:8px;
          gap:10px; flex-wrap:wrap; cursor:pointer; transition:border-color 0.15s;
        }
        .lead-row:hover { border-color:rgba(59,139,255,0.3); }
        .lead-info { display:flex; align-items:center; gap:10px; min-width:0; }
        .lead-avatar {
          width:40px; height:40px;
          background:rgba(59,139,255,0.15);
          border:1px solid rgba(59,139,255,0.2);
          border-radius:8px;
          display:flex; align-items:center; justify-content:center;
          font-family:var(--font-syne),sans-serif;
          font-size:11px; font-weight:700; color:var(--blue); flex-shrink:0;
        }
        .lead-name { font-size:13px; font-weight:600; color:#fff; margin:0; }
        .lead-role { font-size:9px; color:var(--muted); text-transform:uppercase; letter-spacing:0.1em; font-weight:700; margin:2px 0 0; }
        .badge-synced {
          font-size:8px; font-weight:700;
          background:rgba(59,139,255,0.1); color:var(--blue);
          padding:3px 8px; border-radius:20px;
          text-transform:uppercase; letter-spacing:0.08em; white-space:nowrap;
        }
        .field-label { font-size:9px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.15em; margin-bottom:6px; }
        .obj-textarea {
          width:100%; background:rgba(0,0,0,0.4);
          border:1px solid var(--border2); border-radius:8px;
          padding:10px 12px; font-size:12px; color:#a1a1aa; line-height:1.7;
          font-family:var(--font-dm-sans),sans-serif;
          outline:none; min-height:90px; transition:border-color 0.15s;
        }
        .obj-textarea:focus { border-color:rgba(59,139,255,0.4); }

        .console-header { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
        .console-left   { display:flex; align-items:center; gap:7px; }
        .pulse-dot { width:7px; height:7px; border-radius:50%; background:var(--blue); flex-shrink:0; }
        .pulse-dot.active { animation:ping 1.2s ease-in-out infinite; }
        @keyframes ping { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.5;transform:scale(1.35)} }
        .section-label { font-size:9px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.18em; }
        .agent-active { display:flex; align-items:center; gap:5px; font-size:9px; font-weight:700; color:var(--blue); text-transform:uppercase; letter-spacing:0.1em; }
        .agent-pulse { width:5px; height:5px; border-radius:50%; background:var(--blue); animation:ping 0.8s ease-in-out infinite; }
        .log-area { max-height:180px; overflow-y:auto; display:flex; flex-direction:column; gap:8px; }
        .log-empty { display:flex; flex-direction:column; align-items:center; padding:24px 0; color:var(--muted2); text-align:center; }
        .log-empty p { font-size:9px; text-transform:uppercase; letter-spacing:0.15em; font-weight:700; }

        .proposal-header {
          display:flex; align-items:center; justify-content:space-between;
          padding:12px 16px; border-bottom:1px solid var(--border);
          background:rgba(255,255,255,0.01); flex-wrap:wrap; gap:8px;
        }
        .badge-quality {
          font-size:8px; font-weight:700;
          background:rgba(34,197,94,0.08); color:#22c55e;
          border:1px solid rgba(34,197,94,0.2);
          padding:3px 8px; border-radius:20px;
          text-transform:uppercase; letter-spacing:0.08em;
        }
        .proposal-body {
          padding:16px; font-size:12px; color:#a1a1aa; line-height:1.9;
          display:flex; flex-direction:column; gap:8px;
          min-height:80px;
        }
        .proposal-footer { display:flex; gap:8px; padding:12px 16px; border-top:1px solid var(--border); flex-wrap:wrap; }
        .btn-approve {
          display:flex; align-items:center; gap:5px;
          background:#16a34a; border:none; border-radius:7px; color:#fff;
          font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;
          padding:8px 14px; cursor:pointer; transition:background 0.15s;
        }
        .btn-approve:hover { background:#15803d; }
        .btn-regen {
          display:flex; align-items:center; gap:5px;
          background:rgba(255,255,255,0.05); border:1px solid var(--border2);
          border-radius:7px; color:var(--text);
          font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em;
          padding:8px 14px; cursor:pointer; transition:background 0.15s;
        }
        .btn-regen:hover { background:rgba(255,255,255,0.08); }
        .btn-dl {
          display:flex; align-items:center; justify-content:center;
          background:transparent; border:none; color:var(--muted);
          padding:8px 10px; border-radius:7px; cursor:pointer; transition:color 0.15s;
        }
        .btn-dl:hover:not(:disabled) { color:var(--text); }
        .btn-dl:disabled { opacity:0.3; cursor:not-allowed; }

        .stats-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px; }
        .stat-tile { background:rgba(255,255,255,0.02); border:1px solid var(--border); border-radius:10px; padding:12px; }
        .stat-num { font-family:var(--font-syne),sans-serif; font-size:26px; font-weight:700; line-height:1; }
        .stat-num.blue    { color:var(--blue); }
        .stat-num.emerald { color:var(--emerald); }
        .stat-sub { font-size:8px; font-weight:700; color:var(--muted); text-transform:uppercase; letter-spacing:0.12em; margin-top:4px; }
        .model-row {
          display:flex; align-items:center; gap:10px;
          background:rgba(0,0,0,0.4); border:1px solid var(--border);
          border-radius:10px; padding:10px 12px;
        }
        .model-icon { width:36px; height:36px; border-radius:50%; background:rgba(168,85,247,0.15); display:flex; align-items:center; justify-content:center; flex-shrink:0; }
        .model-name { font-size:10px; font-weight:700; color:var(--text); text-transform:uppercase; letter-spacing:0.1em; }
        .model-provider { font-size:9px; color:var(--muted); text-transform:uppercase; letter-spacing:0.08em; margin-top:2px; }
      `}</style>
    </>
  );
}