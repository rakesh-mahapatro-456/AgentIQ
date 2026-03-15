"use client";
import { useState } from "react";
import { Upload, CheckCircle, Zap, FileText, Search, Filter, Target } from "lucide-react";

function LeadRow({ name, company, status }) {
  const isRunning = status === "In progress";
  const isDone    = status === "Done";

  return (
    <div style={{
      display: "flex", alignItems: "center", justifyContent: "space-between",
      padding: "10px 0",
      borderBottom: "1px solid rgba(255,255,255,0.03)",
    }}>
      <div>
        <p style={{ fontSize: 12, fontWeight: 600, color: "#e4e4e7", margin: 0 }}>{name}</p>
        <p style={{ fontSize: 9, color: "#52525b", textTransform: "uppercase", letterSpacing: "0.08em", margin: "2px 0 0", fontWeight: 700 }}>{company}</p>
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em",
        color: isDone ? "#22c55e" : isRunning ? "#3B8BFF" : "#71717a",
        display: "flex", alignItems: "center", gap: 4,
      }}>
        {isDone && <CheckCircle size={10} />}
        {isRunning && <span style={{
          width: 6, height: 6, borderRadius: "50%", background: "#3B8BFF",
          animation: "blink 1s ease-in-out infinite", flexShrink: 0,
        }} />}
        {status}
      </span>
    </div>
  );
}

export default function BatchPage() {
  const [isDragging, setIsDragging] = useState(false);
  const [progress]                  = useState(65);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndustry, setSelectedIndustry] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [filteredLeads, setFilteredLeads] = useState([]);

  // Sample leads data (in real app, this would come from API)
  const sampleLeads = [
    { name: "john.anderson@techcorp.com", company: "Technology", status: "completed" },
    { name: "sarah.miller@financialservices.com", company: "Finance", status: "completed" },
    { name: "michael.chen@healthcare.com", company: "Healthcare", status: "completed" },
    { name: "emily.rodriguez@retail.com", company: "Retail", status: "completed" },
    { name: "david.kim@manufacturing.com", company: "Manufacturing", status: "completed" },
    { name: "lisa.thompson@consulting.com", company: "Professional Services", status: "completed" },
    { name: "james.wilson@education.com", company: "Education", status: "completed" },
    { name: "maria.garcia@realestate.com", company: "Real Estate", status: "completed" },
    { name: "robert.brown@logistics.com", company: "Transportation", status: "completed" },
    { name: "jennifer.davis@marketing.com", company: "Marketing", status: "completed" },
    { name: "chris.lee@construction.com", company: "Construction", status: "completed" },
    { name: "amanda.white@legal.com", company: "Legal", status: "completed" },
    { name: "kevin.johnson@energy.com", company: "Energy", status: "completed" },
    { name: "nicole.martinez@nonprofit.com", company: "Non-Profit", status: "completed" },
    { name: "daniel.taylor@automotive.com", company: "Automotive", status: "completed" },
    { name: "rachel.green@pharma.com", company: "Pharmaceuticals", status: "completed" },
    { name: "thomas.hall@insurance.com", company: "Insurance", status: "completed" },
    { name: "jessica.allen@startup.com", company: "Technology", status: "completed" },
    { name: "matthew.clark@telecom.com", company: "Telecommunications", status: "completed" },
    { name: "sophie.turner@fintech.com", company: "Finance", status: "completed" },
    { name: "oliver.harris@government.com", company: "Technology", status: "completed" },
    { name: "isabella.king@biotech.com", company: "Healthcare", status: "completed" },
    { name: "liam.wright@agriculture.com", company: "Agriculture", status: "completed" },
    { name: "mia.scott@hospitality.com", company: "Hospitality", status: "completed" }
  ];

  const handleSearch = async () => {
    if (!searchQuery.trim() && !selectedIndustry) {
      alert("Please enter a search query or select an industry");
      return;
    }

    setIsSearching(true);
    
    try {
      // In real app, this would call the API
      // const response = await fetch('/api/batch/leads/search', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({
      //     query: searchQuery,
      //     industry: selectedIndustry,
      //     limit: 100
      //   })
      // });
      
      // For demo, filter the sample leads
      let filtered = sampleLeads.filter(lead => {
        const matchesQuery = !searchQuery.trim() || 
          lead.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          lead.company.toLowerCase().includes(searchQuery.toLowerCase());
        
        const matchesIndustry = !selectedIndustry || 
          lead.company.toLowerCase().includes(selectedIndustry.toLowerCase());
        
        return matchesQuery && matchesIndustry;
      });
      
      setSearchResults(filtered);
      setFilteredLeads(filtered);
      
      alert(`Found ${filtered.length} leads matching your search`);
    } catch (error) {
      console.error('Search failed:', error);
      alert('Search failed!');
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <>
      <div className="batch-grid">

        {/* ══ LEFT — Upload + Preview ══ */}
        <div className="col-left">

          {/* Drop zone */}
          <div
            className={`dropzone ${isDragging ? "dragging" : ""}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}
          >
            <div className="drop-icon">
              <Upload size={28} style={{ color: "#3B8BFF" }} />
            </div>
            <h3 className="drop-title">Drop your CSV here</h3>
            <p className="drop-sub">
              Must include: email, name, company columns.<br />Max 500 leads per batch.
            </p>
            <button className="choose-btn">Choose File</button>
          </div>

          {/* Search Section */}
          <div className="search-card">
            <div className="preview-header">
              <span className="card-label" style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Search size={16} style={{ color: "#3B8BFF" }} />
                Search & Filter Leads
                {isSearching && (
                  <span style={{
                    fontSize: 10, 
                    background: "#3B8BFF", 
                    color: "white", 
                    padding: "2px 6px", 
                    borderRadius: "4px",
                    fontFamily: "monospace"
                  }}>
                    {searchResults.length} Results
                  </span>
                )}
              </span>
            </div>
            <div style={{ padding: "16px" }}>
              <div style={{ display: "flex", gap: 8, marginBottom: 12 }}>
                <input
                  type="text"
                  placeholder="Search by name, company, email..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{
                    flex: 1,
                    padding: "8px 12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.02)",
                    color: "#e4e4e7",
                    fontSize: 12,
                    outline: "none",
                    transition: "all 0.2s"
                  }}
                  onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                />
                <select
                  value={selectedIndustry}
                  onChange={(e) => setSelectedIndustry(e.target.value)}
                  style={{
                    padding: "8px 12px",
                    border: "1px solid rgba(255,255,255,0.1)",
                    borderRadius: "6px",
                    background: "rgba(255,255,255,0.02)",
                    color: "#e4e4e7",
                    fontSize: 12,
                    outline: "none"
                  }}
                >
                  <option value="">All Industries</option>
                  <option value="Technology">Technology</option>
                  <option value="Finance">Finance</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Retail">Retail</option>
                  <option value="Manufacturing">Manufacturing</option>
                  <option value="Education">Education</option>
                  <option value="Real Estate">Real Estate</option>
                  <option value="Consulting">Consulting</option>
                </select>
                <button
                  onClick={handleSearch}
                  style={{
                    padding: "8px 16px",
                    border: "1px solid #3B8BFF",
                    borderRadius: "6px",
                    background: "#3B8BFF",
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    transition: "all 0.2s"
                  }}
                >
                  <Search size={14} />
                  Search
                </button>
              </div>

              {/* Quick Actions for Search Results */}
              {isSearching && searchResults.length > 0 && (
                <div style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 12px",
                  background: "rgba(59, 139, 255, 0.1)",
                  border: "1px solid rgba(59, 139, 255, 0.3)",
                  borderRadius: "6px",
                  marginBottom: 12
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Target size={14} style={{ color: "#3B8BFF" }} />
                    <span style={{ fontSize: 11, color: "#3B8BFF" }}>
                      Found {searchResults.length} leads matching your search
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #3B8BFF",
                        borderRadius: "4px",
                        background: "transparent",
                        color: "#3B8BFF",
                        fontSize: 10,
                        cursor: "pointer",
                        transition: "all 0.2s"
                      }}
                    >
                      Select All ({searchResults.length})
                    </button>
                    <button
                      style={{
                        padding: "4px 8px",
                        border: "1px solid #22c55e",
                        borderRadius: "4px",
                        background: "#22c55e",
                        color: "white",
                        fontSize: 10,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        transition: "all 0.2s"
                      }}
                    >
                      <FileText size={10} />
                      Generate Drafts
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Lead preview table */}
          <div className="preview-card">
            <div className="preview-header">
              <span className="card-label">
                Lead Preview — {isSearching ? `${searchResults.length} Search Results` : "24 Leads Loaded"}
                {isSearching && (
                  <span style={{
                    fontSize: 10, 
                    background: "#3B8BFF", 
                    color: "white", 
                    padding: "2px 6px", 
                    borderRadius: "4px",
                    fontFamily: "monospace",
                    marginLeft: 8
                  }}>
                    SEARCHING
                  </span>
                )}
              </span>
              <span style={{ fontSize: 10, color: "#3B8BFF", fontFamily: "monospace" }}>
                {isSearching ? "search results" : "demo_batch_leads.csv"}
              </span>
            </div>
            <div style={{ padding: "4px 16px 12px" }}>
              {(isSearching ? filteredLeads : sampleLeads).slice(0, 8).map((lead, index) => (
                <LeadRow 
                  key={index}
                  name={lead.name} 
                  company={lead.company} 
                  status={lead.status} 
                />
              ))}
            </div>
          </div>
        </div>

        {/* ══ RIGHT — Config + Progress ══ */}
        <div className="col-right">

          {/* Config card */}
          <div className="config-card">
            <p className="card-label" style={{ marginBottom: 20 }}>Batch Configuration</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div>
                <p className="field-label">Global Objective</p>
                <textarea
                  className="obj-textarea"
                  placeholder="e.g., Focus on security compliance and enterprise ROI"
                  rows={3}
                />
              </div>

              <div>
                <p className="field-label">LLM Model</p>
                <div className="model-display">
                  <span style={{ fontSize: 13, color: "#a1a1aa" }}>
                    Groq · llama-3.3-70b <span style={{ color: "#52525b" }}>(fast)</span>
                  </span>
                  <Zap size={13} style={{ color: "#f97316", fill: "#f97316", flexShrink: 0 }} />
                </div>
              </div>
            </div>

            <button className="run-btn">
              <Zap size={13} style={{ fill: "white", color: "white" }} />
              Run Batch
            </button>
          </div>

          {/* Live processing card */}
          <div className="processing-card">
            <p className="card-label" style={{ marginBottom: 20 }}>Live Processing</p>

            <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

              {/* In-progress item */}
              <div>
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  alignItems: "center", marginBottom: 8,
                }}>
                  <span style={{ fontSize: 11, color: "#e4e4e7", fontWeight: 600 }}>
                    Rakesh Mahapatra — Infosys
                  </span>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: "#3B8BFF",
                    textTransform: "uppercase", letterSpacing: "0.08em",
                    animation: "blink 1s ease-in-out infinite",
                  }}>
                    Drafting…
                  </span>
                </div>
                {/* Progress bar */}
                <div style={{
                  height: 3, background: "rgba(255,255,255,0.06)",
                  borderRadius: 99, overflow: "hidden",
                }}>
                  <div style={{
                    width: `${progress}%`, height: "100%",
                    background: "linear-gradient(90deg, #3B8BFF, #00E5C3)",
                    borderRadius: 99,
                    transition: "width 0.4s ease",
                  }} />
                </div>
                <p style={{ fontSize: 9, color: "#52525b", marginTop: 5, textAlign: "right" }}>
                  {progress}%
                </p>
              </div>

              {/* Completed item */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                background: "rgba(34,197,94,0.05)",
                border: "1px solid rgba(34,197,94,0.1)",
                borderRadius: 9,
              }}>
                <span style={{ fontSize: 11, color: "#e4e4e7", fontWeight: 600 }}>
                  Anita Mehta — TCS
                </span>
                <span style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 9, fontWeight: 700, color: "#22c55e",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  <CheckCircle size={11} /> Complete
                </span>
              </div>

              {/* Completed item */}
              <div style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "10px 14px",
                background: "rgba(34,197,94,0.05)",
                border: "1px solid rgba(34,197,94,0.1)",
                borderRadius: 9,
              }}>
                <span style={{ fontSize: 11, color: "#e4e4e7", fontWeight: 600 }}>
                  Priya Krishnan — Wipro
                </span>
                <span style={{
                  display: "flex", alignItems: "center", gap: 5,
                  fontSize: 9, fontWeight: 700, color: "#22c55e",
                  textTransform: "uppercase", letterSpacing: "0.08em",
                }}>
                  <CheckCircle size={11} /> Complete
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ── Grid ── */
        .batch-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 16px;
        }
        @media (max-width: 900px) { .batch-grid { grid-template-columns: 1fr; } }

        .col-left, .col-right {
          display: flex; flex-direction: column; gap: 16px;
        }

        /* ── Drop zone ── */
        .dropzone {
          border: 2px dashed rgba(255,255,255,0.08);
          border-radius: 14px;
          background: #0c0c0e;
          padding: 48px 24px;
          display: flex; flex-direction: column;
          align-items: center; justify-content: center;
          text-align: center;
          transition: border-color 0.2s, background 0.2s;
          cursor: pointer;
        }
        .dropzone:hover,
        .dropzone.dragging {
          border-color: rgba(59,139,255,0.4);
          background: rgba(59,139,255,0.03);
        }
        @media (max-width: 480px) { .dropzone { padding: 32px 16px; } }

        .drop-icon {
          width: 60px; height: 60px;
          background: rgba(59,139,255,0.08);
          border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 20px;
        }
        .drop-title {
          font-family: var(--font-syne), sans-serif;
          font-size: 16px; font-weight: 700; color: #fff;
          margin: 0 0 8px;
        }
        .drop-sub {
          font-size: 12px; color: #52525b; line-height: 1.7;
          margin: 0 0 20px; max-width: 280px;
        }
        .choose-btn {
          background: #3B8BFF; border: none; border-radius: 8px;
          color: #fff; font-size: 10px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.08em;
          padding: 9px 20px; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          transition: background 0.15s;
        }
        .choose-btn:hover { background: #2a7aff; }

        /* ── Preview card ── */
        .preview-card {
          background: #0c0c0e;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px; overflow: hidden;
        }
        .search-card {
          background: #0c0c0e;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px; overflow: hidden;
        }
        .preview-header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 12px 16px;
          border-bottom: 1px solid rgba(255,255,255,0.05);
          background: rgba(255,255,255,0.01);
          flex-wrap: wrap; gap: 6px;
        }

        /* ── Config card ── */
        .config-card {
          background: #0c0c0e;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px; padding: 20px;
          display: flex; flex-direction: column; gap: 0;
        }
        .processing-card {
          background: #0c0c0e;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 12px; padding: 20px;
        }

        /* ── Shared labels ── */
        .card-label {
          font-size: 9px; font-weight: 700; color: #52525b;
          text-transform: uppercase; letter-spacing: 0.18em;
        }
        .field-label {
          font-size: 9px; font-weight: 700; color: #52525b;
          text-transform: uppercase; letter-spacing: 0.15em; margin-bottom: 7px;
        }

        /* ── Textarea ── */
        .obj-textarea {
          width: 100%;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 10px 12px;
          font-size: 12px; color: #a1a1aa; line-height: 1.7;
          font-family: var(--font-dm-sans), sans-serif;
          outline: none; resize: vertical;
          transition: border-color 0.15s;
        }
        .obj-textarea:focus { border-color: rgba(59,139,255,0.4); }
        .obj-textarea::placeholder { color: #3f3f46; }

        /* ── Model display ── */
        .model-display {
          display: flex; align-items: center; justify-content: space-between;
          background: rgba(0,0,0,0.4);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px; padding: 10px 12px;
        }

        /* ── Run button ── */
        .run-btn {
          display: flex; align-items: center; justify-content: center; gap: 7px;
          width: 100%; margin-top: 20px;
          background: #3B8BFF; border: none; border-radius: 9px;
          color: #fff; font-size: 11px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          padding: 12px; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          transition: background 0.15s;
        }
        .run-btn:hover { background: #2a7aff; }

        /* ── Animations ── */
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.4; }
        }
      `}</style>
    </>
  );
}