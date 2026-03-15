"use client";
import { useRouter, usePathname } from "next/navigation";
import { Menu, Zap } from "lucide-react";

export function TopBar({ onMenuClick, isRunning, onInit }) {
  const router   = useRouter();
  const pathname = usePathname();

  const isBatch = pathname.startsWith("/batch");

  return (
    <header style={{
      display: "flex",
      alignItems: "center",
      gap: 12,
      padding: "13px 20px",
      background: "#0c0c0e",
      borderBottom: "1px solid rgba(255,255,255,0.06)",
      flexShrink: 0,
      position: "sticky",
      top: 0,
      zIndex: 30,
    }}>
      {/* Hamburger */}
      <button
        onClick={onMenuClick}
        aria-label="Toggle sidebar"
        style={{
          width: 32, height: 32,
          borderRadius: 7,
          border: "1px solid rgba(255,255,255,0.1)",
          background: "transparent",
          cursor: "pointer",
          display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
          color: "#71717a",
        }}
      >
        <Menu size={17} strokeWidth={2} />
      </button>

      {/* Title */}
      <div style={{ flex: 1, minWidth: 0, overflow: "hidden" }}>
        <h1 style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 16, fontWeight: 700,
          color: "#fff", fontStyle: "italic",
          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
          margin: 0,
        }}>
          Agent Workspace
        </h1>
        <p style={{
          fontSize: 9, fontWeight: 700, color: "#52525b",
          textTransform: "uppercase", letterSpacing: "0.12em",
          whiteSpace: "nowrap", margin: 0,
        }}>
          Research, draft, and sync Salesforce proposals
        </p>
      </div>

      {/* Actions */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>

        {/* Tab group — hidden on mobile */}
        <div
          className="tab-group-hide"
          style={{
            display: "flex",
            background: "#111318",
            borderRadius: 7, padding: 3,
            border: "1px solid rgba(255,255,255,0.06)", gap: 2,
          }}
        >
          {/* Single Lead → /dashboard */}
          <button
            onClick={() => router.push("/dashboard")}
            style={{
              fontSize: 9, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "5px 10px", borderRadius: 5,
              border: "none",
              background: !isBatch ? "#0c0c0e" : "transparent",
              color:      !isBatch ? "#e4e4e7"  : "#71717a",
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            Single Lead
          </button>

          {/* Batch CSV → /batch */}
          <button
            onClick={() => router.push("/batch")}
            style={{
              fontSize: 9, fontWeight: 700,
              textTransform: "uppercase", letterSpacing: "0.08em",
              padding: "5px 10px", borderRadius: 5,
              border: "none",
              background: isBatch ? "#0c0c0e" : "transparent",
              color:      isBatch ? "#e4e4e7"  : "#71717a",
              cursor: "pointer", whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            Batch CSV
          </button>
        </div>

        {/* Initialize Agent */}
        <button
          onClick={onInit}
          disabled={isRunning}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: isRunning ? "#1a5fd4" : "#3B8BFF",
            border: "none", borderRadius: 7, color: "#fff",
            fontSize: 10, fontWeight: 700,
            textTransform: "uppercase", letterSpacing: "0.08em",
            padding: "7px 14px",
            cursor: isRunning ? "not-allowed" : "pointer",
            whiteSpace: "nowrap", transition: "background 0.15s",
          }}
        >
          <Zap size={13} style={{ fill: "white", color: "white", flexShrink: 0 }} />
          <span>{isRunning ? "Running…" : "Initialize Agent"}</span>
        </button>
      </div>

      <style jsx>{`
        @media (max-width: 600px) {
          .tab-group-hide { display: none !important; }
        }
      `}</style>
    </header>
  );
}