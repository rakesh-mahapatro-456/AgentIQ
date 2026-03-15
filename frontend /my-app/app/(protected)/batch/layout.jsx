"use client";
import { useState, useRef } from "react";
import { Upload, CheckCircle, Zap, AlertCircle } from "lucide-react";
import axios from "axios";

const API_BASE = `${process.env.NEXT_PUBLIC_BACKEND_URL}/api`;

function LeadRow({ name, company, status }) {
  const isRunning = status === "In progress" || status === "processing";
  const isDone    = status === "Done"         || status === "completed";
  const isError   = status === "error";

  return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid rgba(255,255,255,0.03)" }}>
      <div>
        <p style={{ fontSize:12, fontWeight:600, color:"#e4e4e7", margin:0 }}>{name}</p>
        <p style={{ fontSize:9, color:"#52525b", textTransform:"uppercase", letterSpacing:"0.08em", margin:"2px 0 0", fontWeight:700 }}>{company}</p>
      </div>
      <span style={{ fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color: isDone?"#22c55e":isError?"#ef4444":isRunning?"#3B8BFF":"#71717a", display:"flex", alignItems:"center", gap:4 }}>
        {isDone    && <CheckCircle size={10}/>}
        {isRunning && <span style={{ width:6, height:6, borderRadius:"50%", background:"#3B8BFF", animation:"blink 1s infinite" }}/>}
        {isError   && <AlertCircle size={10}/>}
        {status}
      </span>
    </div>
  );
}

export default function BatchPage() {
  const [isDragging,    setIsDragging]    = useState(false);
  const [uploading,     setUploading]     = useState(false);
  const [results,       setResults]       = useState([]);
  const [fileName,      setFileName]      = useState(null);
  const [error,         setError]         = useState(null);
  const [objective,     setObjective]     = useState("");
  const fileInputRef = useRef(null);

  async function handleFile(file) {
    if (!file || !file.name.endsWith(".csv")) {
      setError("Only CSV files are supported.");
      return;
    }
    setError(null);
    setFileName(file.name);
    setUploading(true);
    setResults([]);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(`${API_BASE}/batch/process`, formData);
      // Ensure we always set results as an array
      const responseData = res.data;
      setResults(Array.isArray(responseData?.data) ? responseData.data : []);
    } catch (err) {
      setError(err.response?.data?.detail || "Batch processing failed.");
      setResults([]); // Ensure results is always an array
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e) {
    e.preventDefault();
    setIsDragging(false);
    handleFile(e.dataTransfer.files[0]);
  }

  function handleInputChange(e) {
    handleFile(e.target.files[0]);
  }

  // Map API result fields to display fields
  const displayLeads = Array.isArray(results) ? results.map((r) => ({
    name:    r.name    || r.Name    || "Unknown",
    company: r.company || r.Company || "—",
    status:  r.status  || "completed",
  })) : [];

  return (
    <>
      <div className="batch-grid">

        {/* ══ LEFT ══ */}
        <div className="col-left">

          {/* Drop zone */}
          <div
            className={`dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={handleDrop}
          >
            <div className="drop-icon">
              <Upload size={28} style={{ color:"#3B8BFF" }}/>
            </div>
            <h3 className="drop-title">Drop your CSV here</h3>
            <p className="drop-sub">
              Must include: email, name, company columns.<br/>Max 500 leads per batch.
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              style={{ display:"none" }}
              onChange={handleInputChange}
            />
            <button
              className="choose-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              {uploading ? "Uploading…" : "Choose File"}
            </button>
            {error && (
              <p style={{ fontSize:11, color:"#ef4444", marginTop:12, display:"flex", alignItems:"center", gap:5 }}>
                <AlertCircle size={12}/> {error}
              </p>
            )}
          </div>

          {/* Lead preview */}
          {(fileName || displayLeads.length > 0) && (
            <div className="preview-card">
              <div className="preview-header">
                <span className="card-label">
                  Lead Preview — {displayLeads.length} Leads Loaded
                </span>
                <span style={{ fontSize:10, color:"#3B8BFF", fontFamily:"monospace" }}>
                  {fileName}
                </span>
              </div>
              <div style={{ padding:"4px 16px 12px" }}>
                {uploading ? (
                  <p style={{ fontSize:12, color:"#52525b", padding:"16px 0", textAlign:"center" }}>
                    Processing CSV…
                  </p>
                ) : displayLeads.length > 0 ? (
                  displayLeads.map((lead, i) => (
                    <LeadRow key={i} name={lead.name} company={lead.company} status={lead.status}/>
                  ))
                ) : (
                  <p style={{ fontSize:12, color:"#52525b", padding:"16px 0", textAlign:"center" }}>
                    No leads loaded yet.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        {/* ══ RIGHT ══ */}
        <div className="col-right">

          {/* Config */}
          <div className="config-card">
            <p className="card-label" style={{ marginBottom:20 }}>Batch Configuration</p>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div>
                <p className="field-label">Global Objective</p>
                <textarea
                  className="obj-textarea"
                  placeholder="e.g., Focus on security compliance and enterprise ROI"
                  rows={3}
                  value={objective}
                  onChange={(e) => setObjective(e.target.value)}
                />
              </div>
              <div>
                <p className="field-label">LLM Model</p>
                <div className="model-display">
                  <span style={{ fontSize:13, color:"#a1a1aa" }}>
                    Groq · llama-3.3-70b <span style={{ color:"#52525b" }}>(fast)</span>
                  </span>
                  <Zap size={13} style={{ color:"#f97316", fill:"#f97316", flexShrink:0 }}/>
                </div>
              </div>
            </div>
            <button
              className="run-btn"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
            >
              <Zap size={13} style={{ fill:"white", color:"white" }}/>
              {uploading ? "Processing…" : "Upload & Run Batch"}
            </button>
          </div>

          {/* Live processing */}
          {displayLeads.length > 0 && (
            <div className="processing-card">
              <p className="card-label" style={{ marginBottom:20 }}>Results</p>
              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {displayLeads.map((lead, i) => (
                  <div key={i} style={{
                    display:"flex", alignItems:"center", justifyContent:"space-between",
                    padding:"10px 14px",
                    background: lead.status === "completed" || lead.status === "Done"
                      ? "rgba(34,197,94,0.05)" : "rgba(59,139,255,0.05)",
                    border: `1px solid ${lead.status === "completed" || lead.status === "Done"
                      ? "rgba(34,197,94,0.1)" : "rgba(59,139,255,0.1)"}`,
                    borderRadius:9,
                  }}>
                    <span style={{ fontSize:11, color:"#e4e4e7", fontWeight:600 }}>
                      {lead.name} — {lead.company}
                    </span>
                    <span style={{ display:"flex", alignItems:"center", gap:5, fontSize:9, fontWeight:700, textTransform:"uppercase", letterSpacing:"0.08em", color: lead.status === "completed" || lead.status === "Done" ? "#22c55e" : "#3B8BFF" }}>
                      {(lead.status === "completed" || lead.status === "Done") && <CheckCircle size={11}/>}
                      {lead.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        .batch-grid { display:grid; grid-template-columns:1fr 340px; gap:16px; }
        @media(max-width:900px) { .batch-grid { grid-template-columns:1fr; } }
        .col-left, .col-right { display:flex; flex-direction:column; gap:16px; }
        .dropzone { border:2px dashed rgba(255,255,255,0.08); border-radius:14px; background:#0c0c0e; padding:48px 24px; display:flex; flex-direction:column; align-items:center; justify-content:center; text-align:center; transition:border-color 0.2s,background 0.2s; cursor:pointer; }
        .dropzone:hover, .dropzone.dragging { border-color:rgba(59,139,255,0.4); background:rgba(59,139,255,0.03); }
        @media(max-width:480px) { .dropzone { padding:32px 16px; } }
        .drop-icon { width:60px; height:60px; background:rgba(59,139,255,0.08); border-radius:50%; display:flex; align-items:center; justify-content:center; margin-bottom:20px; }
        .drop-title { font-family:var(--font-syne),sans-serif; font-size:16px; font-weight:700; color:#fff; margin:0 0 8px; }
        .drop-sub { font-size:12px; color:#52525b; line-height:1.7; margin:0 0 20px; max-width:280px; }
        .choose-btn { background:#3B8BFF; border:none; border-radius:8px; color:#fff; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; padding:9px 20px; cursor:pointer; font-family:var(--font-dm-sans),sans-serif; transition:background 0.15s; }
        .choose-btn:hover:not(:disabled) { background:#2a7aff; }
        .choose-btn:disabled { opacity:0.5; cursor:not-allowed; }
        .preview-card { background:#0c0c0e; border:1px solid rgba(255,255,255,0.05); border-radius:12px; overflow:hidden; }
        .preview-header { display:flex; align-items:center; justify-content:space-between; padding:12px 16px; border-bottom:1px solid rgba(255,255,255,0.05); background:rgba(255,255,255,0.01); flex-wrap:wrap; gap:6px; }
        .config-card { background:#0c0c0e; border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:20px; display:flex; flex-direction:column; }
        .processing-card { background:#0c0c0e; border:1px solid rgba(255,255,255,0.05); border-radius:12px; padding:20px; }
        .card-label { font-size:9px; font-weight:700; color:#52525b; text-transform:uppercase; letter-spacing:0.18em; }
        .field-label { font-size:9px; font-weight:700; color:#52525b; text-transform:uppercase; letter-spacing:0.15em; margin-bottom:7px; }
        .obj-textarea { width:100%; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px 12px; font-size:12px; color:#a1a1aa; line-height:1.7; font-family:var(--font-dm-sans),sans-serif; outline:none; resize:vertical; transition:border-color 0.15s; }
        .obj-textarea:focus { border-color:rgba(59,139,255,0.4); }
        .obj-textarea::placeholder { color:#3f3f46; }
        .model-display { display:flex; align-items:center; justify-content:space-between; background:rgba(0,0,0,0.4); border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:10px 12px; }
        .run-btn { display:flex; align-items:center; justify-content:center; gap:7px; width:100%; margin-top:20px; background:#3B8BFF; border:none; border-radius:9px; color:#fff; font-size:11px; font-weight:700; text-transform:uppercase; letter-spacing:0.1em; padding:12px; cursor:pointer; font-family:var(--font-dm-sans),sans-serif; transition:background 0.15s; }
        .run-btn:hover:not(:disabled) { background:#2a7aff; }
        .run-btn:disabled { opacity:0.5; cursor:not-allowed; }
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.4} }
      `}</style>
    </>
  );
}