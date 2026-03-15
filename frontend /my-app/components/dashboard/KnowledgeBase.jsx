"use client";
import { useState, useRef, useEffect } from "react";
import { Upload, FileText, Trash2, CheckCircle, AlertCircle, Loader2 } from "lucide-react";

export function KnowledgeBase() {
  const [uploadStatus, setUploadStatus] = useState("idle"); // idle, uploading, success, error
  const [uploadMessage, setUploadMessage] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [knowledgeBaseFiles, setKnowledgeBaseFiles] = useState([]);
  const [isClearing, setIsClearing] = useState(false);
  const fileInputRef = useRef(null);

  const API_BASE = "http://localhost:8000/api";

  // Fetch knowledge base files on component mount
  useEffect(() => {
    fetchKnowledgeBaseFiles();
  }, []);

  const fetchKnowledgeBaseFiles = async () => {
    try {
      const response = await fetch(`${API_BASE}/kb/list`);
      if (response.ok) {
        const data = await response.json();
        setKnowledgeBaseFiles(data.documents || []);
      }
    } catch (error) {
      console.error('Failed to fetch knowledge base files:', error);
    }
  };

  const handleFileUpload = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file type
    const validTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];
    if (!validTypes.includes(file.type)) {
      setUploadStatus("error");
      setUploadMessage("Please upload a PDF or DOC file");
      return;
    }

    // Validate file size (10MB max)
    if (file.size > 10 * 1024 * 1024) {
      setUploadStatus("error");
      setUploadMessage("File size must be less than 10MB");
      return;
    }

    setUploadStatus("uploading");
    setUploadMessage("Uploading and processing document...");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch(`${API_BASE}/kb/ingest`, {
        method: "POST",
        body: formData,
      });

      if (response.ok) {
        const result = await response.json();
        setUploadStatus("success");
        setUploadMessage(result.message);
        setUploadedFiles(prev => [...prev, file.name]);
        // Refresh knowledge base files
        await fetchKnowledgeBaseFiles();
      } else {
        const error = await response.json();
        setUploadStatus("error");
        setUploadMessage(error.detail || "Upload failed");
      }
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage("Network error during upload");
    }
  };

  const handleClearKnowledgeBase = async () => {
    if (!confirm("Are you sure you want to clear the entire knowledge base? This action cannot be undone.")) {
      return;
    }

    setIsClearing(true);
    try {
      const response = await fetch(`${API_BASE}/kb/clear`, {
        method: "DELETE",
      });

      if (response.ok) {
        const result = await response.json();
        setUploadedFiles([]);
        setKnowledgeBaseFiles([]); // Clear the knowledge base files list
        setUploadStatus("success");
        setUploadMessage(result.message);
      } else {
        const error = await response.json();
        setUploadStatus("error");
        setUploadMessage(error.detail || "Failed to clear knowledge base");
      }
    } catch (error) {
      setUploadStatus("error");
      setUploadMessage("Network error while clearing knowledge base");
    } finally {
      setIsClearing(false);
    }
  };

  const resetUploadStatus = () => {
    setUploadStatus("idle");
    setUploadMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div style={{
      background: "#0c0c0e",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "12px",
      padding: "24px",
      marginBottom: "24px"
    }}>
      <div style={{ marginBottom: "20px" }}>
        <h3 style={{
          color: "#fff",
          fontSize: "18px",
          fontWeight: "600",
          margin: "0 0 8px",
          fontFamily: "var(--font-syne), sans-serif",
        }}>
          Knowledge Base
        </h3>
        <p style={{
          color: "#71717a",
          fontSize: "14px",
          margin: "0",
          lineHeight: "1.5",
        }}>
          Upload product information documents (PDF/DOC) to enhance AI proposal generation
        </p>
      </div>

      {/* Upload Area */}
      <div style={{
        border: "2px dashed rgba(255,255,255,0.1)",
        borderRadius: "8px",
        padding: "32px",
        textAlign: "center",
        marginBottom: "20px",
        transition: "all 0.2s",
        cursor: "pointer",
        background: uploadStatus === "uploading" ? "rgba(59,139,255,0.05)" : "transparent",
        borderColor: uploadStatus === "error" ? "rgba(239,68,68,0.5)" : 
                     uploadStatus === "success" ? "rgba(34,197,94,0.5)" : "rgba(255,255,255,0.1)",
      }}
      onClick={() => fileInputRef.current?.click()}
      onMouseEnter={(e) => {
        if (uploadStatus === "idle") {
          e.target.style.borderColor = "rgba(59,139,255,0.5)";
          e.target.style.background = "rgba(59,139,255,0.02)";
        }
      }}
      onMouseLeave={(e) => {
        if (uploadStatus === "idle") {
          e.target.style.borderColor = "rgba(255,255,255,0.1)";
          e.target.style.background = "transparent";
        }
      }}
    >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={handleFileUpload}
          style={{ display: "none" }}
        />

        {uploadStatus === "uploading" ? (
          <div>
            <Loader2 size={32} style={{ color: "#3B8BFF", animation: "spin 1s linear infinite" }} />
            <p style={{ color: "#3B8BFF", marginTop: "12px", margin: "0" }}>{uploadMessage}</p>
          </div>
        ) : uploadStatus === "success" ? (
          <div>
            <CheckCircle size={32} style={{ color: "#22c55e" }} />
            <p style={{ color: "#22c55e", marginTop: "12px", margin: "0" }}>{uploadMessage}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetUploadStatus();
              }}
              style={{
                marginTop: "12px",
                padding: "8px 16px",
                background: "#22c55e",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Upload Another
            </button>
          </div>
        ) : uploadStatus === "error" ? (
          <div>
            <AlertCircle size={32} style={{ color: "#ef4444" }} />
            <p style={{ color: "#ef4444", marginTop: "12px", margin: "0" }}>{uploadMessage}</p>
            <button
              onClick={(e) => {
                e.stopPropagation();
                resetUploadStatus();
              }}
              style={{
                marginTop: "12px",
                padding: "8px 16px",
                background: "#ef4444",
                color: "white",
                border: "none",
                borderRadius: "6px",
                fontSize: "12px",
                cursor: "pointer",
              }}
            >
              Try Again
            </button>
          </div>
        ) : (
          <div>
            <Upload size={32} style={{ color: "#71717a" }} />
            <p style={{ color: "#e4e4e7", marginTop: "12px", margin: "0", fontSize: "16px", fontWeight: "500" }}>
              Click to upload or drag and drop
            </p>
            <p style={{ color: "#71717a", marginTop: "4px", margin: "0", fontSize: "12px" }}>
              PDF or DOC files (max 10MB)
            </p>
          </div>
        )}
      </div>

      {/* Knowledge Base Files List */}
      {knowledgeBaseFiles.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{
            color: "#e4e4e7",
            fontSize: "14px",
            fontWeight: "600",
            margin: "0 0 12px",
          }}>
            Knowledge Base Files ({knowledgeBaseFiles.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {knowledgeBaseFiles.map((file, index) => (
              <div key={index} style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.06)"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <FileText size={16} style={{ color: "#3B8BFF" }} />
                  <div>
                    <div style={{ 
                      color: "#e4e4e7", 
                      fontSize: "13px", 
                      fontWeight: "500",
                      marginBottom: "2px"
                    }}>
                      {file.filename}
                    </div>
                    <div style={{ 
                      color: "#71717a", 
                      fontSize: "11px" 
                    }}>
                      {file.chunks} chunks • {file.pages} pages
                    </div>
                  </div>
                </div>
                <div style={{
                  fontSize: "11px",
                  color: "#71717a",
                  background: file.uploaded_at === "Unknown" ? "rgba(239, 68, 68, 0.1)" : "rgba(34, 197, 94, 0.1)",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  border: file.uploaded_at === "Unknown" ? "1px solid rgba(239, 68, 68, 0.3)" : "1px solid rgba(34, 197, 94, 0.3)"
                }}>
                  {file.uploaded_at === "Unknown" ? "Legacy" : "Indexed"}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Session Uploads */}
      {uploadedFiles.length > 0 && (
        <div style={{ marginBottom: "20px" }}>
          <h4 style={{
            color: "#e4e4e7",
            fontSize: "14px",
            fontWeight: "600",
            margin: "0 0 12px",
          }}>
            Session Uploads ({uploadedFiles.length})
          </h4>
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {uploadedFiles.map((fileName, index) => (
              <div key={index} style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "8px 12px",
                background: "rgba(255,255,255,0.03)",
                borderRadius: "6px",
                border: "1px solid rgba(255,255,255,0.06)"
              }}>
                <FileText size={16} style={{ color: "#22c55e" }} />
                <span style={{ color: "#e4e4e7", fontSize: "12px", flex: 1 }}>{fileName}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Clear Knowledge Base Button */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <p style={{
          color: "#71717a",
          fontSize: "12px",
          margin: "0",
        }}>
          Documents are processed and stored for AI retrieval
        </p>
        <button
          onClick={handleClearKnowledgeBase}
          disabled={isClearing}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "6px",
            padding: "8px 12px",
            background: isClearing ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.1)",
            color: "#ef4444",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "6px",
            fontSize: "12px",
            cursor: isClearing ? "not-allowed" : "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!isClearing) {
              e.target.style.background = "rgba(239,68,68,0.2)";
            }
          }}
          onMouseLeave={(e) => {
            e.target.style.background = isClearing ? "rgba(239,68,68,0.5)" : "rgba(239,68,68,0.1)";
          }}
        >
          {isClearing ? (
            <Loader2 size={14} style={{ animation: "spin 1s linear infinite" }} />
          ) : (
            <Trash2 size={14} />
          )}
          {isClearing ? "Clearing..." : "Clear Knowledge Base"}
        </button>
      </div>

      <style jsx>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
