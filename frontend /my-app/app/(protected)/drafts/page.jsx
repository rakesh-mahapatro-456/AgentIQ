"use client";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { Search, Plus, Download, RotateCcw, X, ExternalLink } from "lucide-react";
import { fetchLeads, downloadProposal } from "@/store/features/draftsSlice";

const STATUS_STYLES = {
  "In review":  { bg:"rgba(59,139,255,0.1)",  color:"#3B8BFF",  border:"rgba(59,139,255,0.2)"  },
  "Sent to SF": { bg:"rgba(34,197,94,0.1)",   color:"#22c55e",  border:"rgba(34,197,94,0.2)"   },
  "Draft":      { bg:"rgba(249,115,22,0.1)",  color:"#f97316",  border:"rgba(249,115,22,0.2)"  },
  "Rejected":   { bg:"rgba(239,68,68,0.1)",   color:"#ef4444",  border:"rgba(239,68,68,0.2)"   },
};

function StatusBadge({ status }) {
  const s = STATUS_STYLES[status] || STATUS_STYLES["Draft"];
  return (
    <span style={{
      fontSize:8, fontWeight:700,
      background:s.bg, color:s.color,
      border:`1px solid ${s.border}`,
      padding:"3px 8px", borderRadius:4,
      textTransform:"uppercase", letterSpacing:"0.1em", whiteSpace:"nowrap",
    }}>
      {status}
    </span>
  );
}

function DraftSheet({ draft, onClose }) {
  const dispatch = useDispatch();
  if (!draft) return null;

  return (
    <>
      <div onClick={onClose} style={{
        position:"fixed", inset:0, background:"rgba(0,0,0,0.6)", zIndex:100, cursor:"pointer",
      }}/>
      <div style={{
        position:"fixed", top:0, right:0,
        width:"min(600px,100vw)", height:"100dvh",
        background:"#09090b", borderLeft:"1px solid rgba(255,255,255,0.08)",
        zIndex:101, display:"flex", flexDirection:"column",
        animation:"slideIn 0.25s ease",
      }}>
        {/* Header */}
        <div style={{ padding:"20px 24px", borderBottom:"1px solid rgba(255,255,255,0.05)", background:"rgba(255,255,255,0.01)" }}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:12 }}>
            <StatusBadge status={draft.status}/>
            <button onClick={onClose} style={{
              width:30, height:30, borderRadius:"50%",
              border:"1px solid rgba(255,255,255,0.1)",
              background:"transparent", cursor:"pointer",
              display:"flex", alignItems:"center", justifyContent:"center", color:"#71717a",
            }}>
              <X size={14}/>
            </button>
          </div>
          <h2 style={{ fontFamily:"var(--font-syne),sans-serif", fontSize:20, fontWeight:700, color:"#fff", margin:"0 0 4px" }}>
            {draft.name}
          </h2>
          <p style={{ fontSize:9, color:"#52525b", textTransform:"uppercase", letterSpacing:"0.12em", fontWeight:700, margin:0 }}>
            {draft.company} · {draft.role}
          </p>
        </div>

        {/* Body */}
        <div style={{ flex:1, overflowY:"auto", padding:"20px 24px", display:"flex", flexDirection:"column", gap:24 }}>
          {/* Agent insights */}
          <div>
            <p style={{ fontSize:9, fontWeight:700, color:"#52525b", textTransform:"uppercase", letterSpacing:"0.18em", marginBottom:10 }}>
              Agent Insights
            </p>
            <div style={{ background:"rgba(0,0,0,0.4)", border:"1px solid rgba(255,255,255,0.05)", borderRadius:10, padding:"14px 16px", display:"flex", flexDirection:"column", gap:10, fontFamily:"monospace", fontSize:11 }}>
              <div style={{ display:"flex", gap:8, color:"#3B8BFF" }}>
                <span style={{ opacity:0.4 }}>[CRM]</span> Found Lead: {draft.name}
              </div>
              <div style={{ display:"flex", gap:8, color:"#22c55e" }}>
                <span style={{ opacity:0.4 }}>[RAG]</span> Retrieved relevant documents
              </div>
              <div style={{ display:"flex", gap:8, color:"#a855f7" }}>
                <span style={{ opacity:0.4 }}>[LLM]</span> Personalizing for {draft.role}…
              </div>
            </div>
          </div>

          {/* Full proposal */}
          <div>
            <p style={{ fontSize:9, fontWeight:700, color:"#52525b", textTransform:"uppercase", letterSpacing:"0.18em", margin:"0 0 10px" }}>
              Full Proposal
            </p>
            <div style={{ background:"#0c0c0e", border:"1px solid rgba(255,255,255,0.08)", borderRadius:10, padding:"18px 20px", fontSize:13, color:"#a1a1aa", lineHeight:1.9, whiteSpace:"pre-wrap" }}>
              {draft.fullContent || "No content available."}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding:"16px 24px", borderTop:"1px solid rgba(255,255,255,0.05)", background:"rgba(0,0,0,0.2)", display:"flex", justifyContent:"flex-end", gap:8 }}>
          <button
            onClick={() => dispatch(downloadProposal({ content: draft.fullContent, lead_name: draft.name }))}
            style={{ width:44, height:44, borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#71717a", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}
          >
            <Download size={14}/>
          </button>
          <button style={{ width:44, height:44, borderRadius:8, background:"rgba(255,255,255,0.05)", border:"1px solid rgba(255,255,255,0.1)", color:"#71717a", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" }}>
            <RotateCcw size={14}/>
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes slideIn { from{transform:translateX(100%)} to{transform:translateX(0)} }
      `}</style>
    </>
  );
}

export default function DraftsPage() {
  const dispatch       = useDispatch();
  const auth           = useSelector((s) => s.auth);
  const leads          = useSelector((s) => s.drafts.items);
  const fetchStatus    = useSelector((s) => s.drafts.status);
  const finalProposal  = useSelector((s) => s.drafts.finalProposal);

  const [filter,        setFilter]        = useState("all");
  const [selectedDraft, setSelectedDraft] = useState(null);
  const [search,        setSearch]        = useState("");

  // Fetch leads on mount if not loaded
  useEffect(() => {
    if (leads.length === 0 && auth.token) {
      dispatch(fetchLeads({ token: auth.token, url: auth.instanceUrl }));
    }
  }, [auth.token]);

  // Map Salesforce leads to draft rows
  const draftsData = leads.map((lead) => ({
    id:          lead.Id,
    name:        lead.Name        || "Unknown",
    company:     lead.Company     || "—",
    role:        lead.Title       || "—",
    preview:     lead.Description || "No preview available",
    status:      lead.Status      || "Draft",
    time:        lead.LastModifiedDate
                   ? new Date(lead.LastModifiedDate).toLocaleDateString()
                   : "—",
    fullContent: finalProposal || lead.Description || "No content yet.",
  }));

  const filtered = draftsData.filter((d) => {
    const matchSearch = d.name.toLowerCase().includes(search.toLowerCase())
                     || d.company.toLowerCase().includes(search.toLowerCase());
    if (!matchSearch) return false;
    if (filter === "all")    return true;
    if (filter === "sent")   return d.status === "Sent to SF";
    if (filter === "draft")  return d.status === "Draft";
    if (filter === "review") return d.status === "In review";
    return true;
  });

  const filters = ["All", "Sent", "Draft", "Review"];

  return (
    <>
      <div className="drafts-page">

        {/* Header */}
        <div className="page-header">
          <div>
            <h1 className="page-title">All Drafts</h1>
            <p className="page-sub">{leads.length} leads loaded from Salesforce</p>
          </div>
          <button
            className="new-btn"
            onClick={() => dispatch(fetchLeads({ token: auth.token, url: auth.instanceUrl }))}
          >
            <Plus size={14}/>
            <span>{fetchStatus === "loading" ? "Fetching…" : "Refresh"}</span>
          </button>
        </div>

        {/* Filters */}
        <div className="filters-row">
          <div className="search-wrap">
            <Search size={14} style={{ position:"absolute", left:11, top:"50%", transform:"translateY(-50%)", color:"#71717a" }}/>
            <input
              className="search-input"
              placeholder="Search leads, companies…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="filter-controls">
            <div className="tab-pills">
              {filters.map((t) => (
                <button
                  key={t}
                  onClick={() => setFilter(t.toLowerCase())}
                  className={`pill-btn ${filter === t.toLowerCase() ? "active" : ""}`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="table-wrap">
          {fetchStatus === "loading" ? (
            <div style={{ padding:40, textAlign:"center", color:"#52525b", fontSize:12 }}>
              Fetching leads from Salesforce…
            </div>
          ) : fetchStatus === "failed" ? (
            <div style={{ padding:40, textAlign:"center", color:"#ef4444", fontSize:12 }}>
              Failed to fetch leads. Check your Salesforce connection.
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding:40, textAlign:"center", color:"#52525b", fontSize:12 }}>
              {leads.length === 0
                ? "No leads loaded. Click Refresh or run the agent on the dashboard."
                : "No results match your filter."}
            </div>
          ) : (
            <table className="drafts-table">
              <thead>
                <tr>
                  <th>Lead / Company</th>
                  <th className="hide-md">Draft Preview</th>
                  <th>Status</th>
                  <th className="hide-sm">Updated</th>
                  <th style={{ textAlign:"right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((draft) => (
                  <tr key={draft.id} onClick={() => setSelectedDraft(draft)} className="draft-row">
                    <td>
                      <p className="lead-name">{draft.name}</p>
                      <p className="lead-meta">{draft.company} · {draft.role}</p>
                    </td>
                    <td className="hide-md">
                      <p className="preview-text">"{draft.preview}"</p>
                    </td>
                    <td><StatusBadge status={draft.status}/></td>
                    <td className="hide-sm time-cell">{draft.time}</td>
                    <td style={{ textAlign:"right" }}>
                      <button className="action-btn"><ExternalLink size={14}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination */}
        <div className="pagination">
          <span className="pag-info">Showing {filtered.length} of {leads.length} leads</span>
          <div className="pag-btns">
            <button className="pag-btn">Prev</button>
            <button className="pag-btn active">1</button>
            <button className="pag-btn">Next</button>
          </div>
        </div>
      </div>

      <DraftSheet draft={selectedDraft} onClose={() => setSelectedDraft(null)}/>

      <style jsx>{`
        .drafts-page { padding:24px 20px; max-width:1440px; margin:0 auto; display:flex; flex-direction:column; gap:20px; }
        @media(max-width:480px) { .drafts-page { padding:14px 12px; gap:14px; } }
        .page-header { display:flex; align-items:center; justify-content:space-between; gap:12px; flex-wrap:wrap; }
        .page-title { font-family:var(--font-syne),sans-serif; font-size:22px; font-weight:700; color:#fff; margin:0; font-style:italic; }
        .page-sub { font-size:11px; color:#52525b; margin:3px 0 0; font-weight:500; }
        .new-btn { display:flex; align-items:center; gap:6px; background:#3B8BFF; border:none; border-radius:8px; color:#fff; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; padding:8px 16px; cursor:pointer; transition:background 0.15s; white-space:nowrap; font-family:var(--font-dm-sans),sans-serif; }
        .new-btn:hover { background:#2a7aff; }
        .filters-row { display:flex; align-items:center; gap:12px; flex-wrap:wrap; }
        .search-wrap { position:relative; flex:1; min-width:200px; }
        .search-input { width:100%; background:#0c0c0e; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:8px 12px 8px 34px; font-size:13px; color:#e4e4e7; font-family:var(--font-dm-sans),sans-serif; outline:none; height:38px; transition:border-color 0.15s; }
        .search-input:focus { border-color:rgba(59,139,255,0.4); }
        .search-input::placeholder { color:#52525b; }
        .filter-controls { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
        .tab-pills { display:flex; background:#0c0c0e; border:1px solid rgba(255,255,255,0.08); border-radius:8px; padding:3px; gap:2px; }
        .pill-btn { font-size:9px; font-weight:700; text-transform:uppercase; letter-spacing:0.08em; padding:5px 10px; border-radius:6px; border:none; background:transparent; color:#52525b; cursor:pointer; transition:all 0.15s; white-space:nowrap; font-family:var(--font-dm-sans),sans-serif; }
        .pill-btn:hover  { color:#e4e4e7; }
        .pill-btn.active { background:rgba(255,255,255,0.08); color:#e4e4e7; }
        .table-wrap { background:#0c0c0e; border:1px solid rgba(255,255,255,0.05); border-radius:12px; overflow:hidden; overflow-x:auto; }
        .drafts-table { width:100%; border-collapse:collapse; min-width:400px; }
        .drafts-table thead tr { background:rgba(255,255,255,0.02); border-bottom:1px solid rgba(255,255,255,0.05); }
        .drafts-table th { padding:11px 16px; font-size:9px; font-weight:700; color:#52525b; text-transform:uppercase; letter-spacing:0.15em; text-align:left; white-space:nowrap; font-family:var(--font-dm-sans),sans-serif; }
        .draft-row { border-bottom:1px solid rgba(255,255,255,0.04); cursor:pointer; transition:background 0.15s; }
        .draft-row:last-child { border-bottom:none; }
        .draft-row:hover { background:rgba(255,255,255,0.02); }
        .drafts-table td { padding:13px 16px; }
        .lead-name { font-size:13px; font-weight:600; color:#e4e4e7; margin:0 0 2px; transition:color 0.15s; font-family:var(--font-dm-sans),sans-serif; }
        .draft-row:hover .lead-name { color:#3B8BFF; }
        .lead-meta { font-size:9px; color:#52525b; text-transform:uppercase; letter-spacing:0.08em; font-weight:700; margin:0; }
        .preview-text { font-size:11px; color:#71717a; font-style:italic; margin:0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; max-width:340px; }
        .time-cell { font-size:11px; color:#52525b; font-weight:500; white-space:nowrap; }
        .action-btn { width:30px; height:30px; border-radius:6px; background:transparent; border:none; color:#52525b; cursor:pointer; display:inline-flex; align-items:center; justify-content:center; transition:color 0.15s,background 0.15s; }
        .action-btn:hover { color:#e4e4e7; background:rgba(255,255,255,0.06); }
        @media(max-width:900px) { .hide-md { display:none; } }
        @media(max-width:560px) { .hide-sm { display:none; } }
        .pagination { display:flex; align-items:center; justify-content:space-between; flex-wrap:wrap; gap:10px; padding:0 4px; }
        .pag-info { font-size:9px; font-weight:700; color:#52525b; text-transform:uppercase; letter-spacing:0.1em; }
        .pag-btns { display:flex; gap:4px; }
        .pag-btn { height:32px; padding:0 12px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); border-radius:7px; color:#71717a; font-size:10px; font-weight:700; text-transform:uppercase; letter-spacing:0.06em; cursor:pointer; transition:all 0.15s; font-family:var(--font-dm-sans),sans-serif; }
        .pag-btn:hover  { color:#e4e4e7; background:rgba(255,255,255,0.08); }
        .pag-btn.active { background:#3B8BFF; border-color:#3B8BFF; color:#fff; }
      `}</style>
    </>
  );
}