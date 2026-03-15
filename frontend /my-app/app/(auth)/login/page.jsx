"use client";
import { Zap } from "lucide-react";

export default function LoginPage() {
  function handleSalesforceLogin() {
    // Replace with your actual Salesforce OAuth URL
    window.location.href = "http://localhost:8000/api/auth/login";
  }

  return (
    <>
      <div className="auth-shell">

        {/* ── LEFT PANEL ── */}
        <div className="left-panel">
          {/* Logo */}
          <div className="logo">
            <div className="logo-icon">
              <Zap size={16} style={{ fill: "white", color: "white" }} />
            </div>
            <span className="logo-text">Agent<span style={{ color: "#00E5C3" }}>IQ</span></span>
          </div>

          {/* Hero copy */}
          <div className="hero">
            <h1 className="hero-title">
              Your AI sales agent.<br />
              <span className="hero-accent">Ready in seconds.</span>
            </h1>
            <p className="hero-sub">
              Connect your Salesforce instance, set your objective,
              and let the agent do the rest — research, draft, and sync.
            </p>

            <ul className="feature-list">
              {[
                "Connect Salesforce in one OAuth click",
                "No credentials stored — OAuth 2.0 only",
                "Team workspaces with role-based access",
                "All draft history saved and auditable",
              ].map((f) => (
                <li key={f} className="feature-item">
                  <span className="check-icon">
                    <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                      <path d="M1 4L3.5 6.5L9 1" stroke="#00E5C3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </span>
                  {f}
                </li>
              ))}
            </ul>
          </div>

          {/* Page indicator */}
          <div className="page-indicator">02 · Auth Page</div>
        </div>

        {/* ── RIGHT PANEL ── */}
        <div className="right-panel">
          <div className="form-card">
            <div className="form-header">
              <h2 className="form-title">Welcome back</h2>
              <p className="form-sub">Sign in with your Salesforce org to continue</p>
            </div>

            {/* Salesforce button */}
            <button className="sf-btn" onClick={handleSalesforceLogin}>
              {/* Salesforce cloud icon */}
              <svg width="22" height="16" viewBox="0 0 22 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M9.14 2.4a4.1 4.1 0 0 1 2.9-1.2 4.15 4.15 0 0 1 3.73 2.34 3.1 3.1 0 0 1 1.27-.27 3.15 3.15 0 0 1 3.15 3.15 3.15 3.15 0 0 1-3.15 3.15H5.1A3.9 3.9 0 0 1 1.2 6.18 3.9 3.9 0 0 1 5.1 2.28c.48 0 .94.09 1.37.25A4.1 4.1 0 0 1 9.14 2.4z" fill="white" fillOpacity="0.9"/>
              </svg>
              <span>Continue with Salesforce</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginLeft: "auto" }}>
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>

            {/* Info note */}
            <div className="info-note">
              <div className="info-icon">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#3B8BFF" strokeWidth="2">
                  <circle cx="12" cy="12" r="10"/>
                  <path d="M12 16v-4M12 8h.01"/>
                </svg>
              </div>
              <p className="info-text">
                We use OAuth 2.0. No passwords are stored.
                You'll be redirected to Salesforce to authorize access.
              </p>
            </div>

            {/* Connect SF org box */}
            <div className="sf-org-box">
              <div className="sf-org-left">
                <div className="sf-avatar">SF</div>
                <div>
                  <p className="sf-org-title">Connect Salesforce org</p>
                  <p className="sf-org-sub">Required for CRM lead fetching</p>
                </div>
              </div>
              <button className="connect-btn" onClick={handleSalesforceLogin}>
                Connect →
              </button>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        /* ── Shell ── */
        .auth-shell {
          display: grid;
          grid-template-columns: 1fr 1fr;
          min-height: 100dvh;
          background: #06090F;
        }
        @media (max-width: 768px) {
          .auth-shell { grid-template-columns: 1fr; }
        }

        /* ── Left panel ── */
        .left-panel {
          background: linear-gradient(160deg, #06090F 0%, #0a1628 50%, #061420 100%);
          padding: 40px 48px;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow: hidden;
        }
        .left-panel::before {
          content: "";
          position: absolute;
          top: -120px; left: -120px;
          width: 500px; height: 500px;
          background: radial-gradient(circle, rgba(0,229,195,0.06) 0%, transparent 70%);
          pointer-events: none;
        }
        @media (max-width: 768px) { .left-panel { display: none; } }

        /* Logo */
        .logo {
          display: flex; align-items: center; gap: 8px; margin-bottom: auto;
        }
        .logo-icon {
          width: 30px; height: 30px; background: #3B8BFF;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text {
          font-family: var(--font-syne), sans-serif;
          font-size: 18px; font-weight: 800; color: #fff; letter-spacing: -0.3px;
        }

        /* Hero */
        .hero { margin-top: auto; margin-bottom: 48px; }
        .hero-title {
          font-family: var(--font-syne), sans-serif;
          font-size: clamp(32px, 4vw, 48px);
          font-weight: 800; color: #fff; line-height: 1.15;
          margin: 0 0 16px; letter-spacing: -1px;
        }
        .hero-accent { color: #00E5C3; display: block; }
        .hero-sub {
          font-size: 14px; color: #52525b; line-height: 1.8;
          margin: 0 0 32px; max-width: 380px;
          font-family: var(--font-dm-sans), sans-serif;
        }

        /* Features */
        .feature-list { list-style: none; padding: 0; margin: 0; display: flex; flex-direction: column; gap: 12px; }
        .feature-item {
          display: flex; align-items: center; gap: 10px;
          font-size: 13px; color: #71717a;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .check-icon {
          width: 20px; height: 20px; border-radius: 50%;
          background: rgba(0,229,195,0.1);
          border: 1px solid rgba(0,229,195,0.2);
          display: flex; align-items: center; justify-content: center;
          flex-shrink: 0;
        }

        /* Page indicator */
        .page-indicator {
          font-size: 9px; font-weight: 700; color: #3f3f46;
          text-transform: uppercase; letter-spacing: 0.15em;
          padding: 6px 12px;
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.06);
          border-radius: 20px;
          align-self: flex-end;
          font-family: var(--font-dm-sans), sans-serif;
        }

        /* ── Right panel ── */
        .right-panel {
          background: #09090b;
          display: flex; align-items: center; justify-content: center;
          padding: 40px 32px;
        }

        .form-card {
          width: 100%;
          max-width: 420px;
          display: flex; flex-direction: column; gap: 20px;
        }

        .form-header { margin-bottom: 4px; }
        .form-title {
          font-family: var(--font-syne), sans-serif;
          font-size: 28px; font-weight: 700; color: #fff;
          margin: 0 0 6px; letter-spacing: -0.5px;
        }
        .form-sub {
          font-size: 13px; color: #52525b;
          margin: 0; font-family: var(--font-dm-sans), sans-serif;
        }

        /* Salesforce CTA button */
        .sf-btn {
          display: flex; align-items: center; gap: 12px;
          width: 100%; padding: 14px 20px;
          background: #1a6fd4;
          border: none; border-radius: 10px;
          color: #fff; font-size: 14px; font-weight: 600;
          cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          transition: background 0.15s, transform 0.1s;
        }
        .sf-btn:hover  { background: #1560be; }
        .sf-btn:active { transform: scale(0.99); }

        /* Info note */
        .info-note {
          display: flex; gap: 10px; align-items: flex-start;
          padding: 12px 14px;
          background: rgba(59,139,255,0.05);
          border: 1px solid rgba(59,139,255,0.12);
          border-radius: 9px;
        }
        .info-icon { flex-shrink: 0; margin-top: 1px; }
        .info-text {
          font-size: 11px; color: #71717a; line-height: 1.7; margin: 0;
          font-family: var(--font-dm-sans), sans-serif;
        }

        /* SF org box */
        .sf-org-box {
          display: flex; align-items: center; justify-content: space-between;
          gap: 12px;
          padding: 14px 16px;
          background: rgba(255,255,255,0.02);
          border: 1px dashed rgba(255,255,255,0.1);
          border-radius: 10px;
        }
        .sf-org-left { display: flex; align-items: center; gap: 12px; }
        .sf-avatar {
          width: 36px; height: 36px; border-radius: 8px;
          background: #1a6fd4;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; font-weight: 700; color: #fff;
          font-family: var(--font-syne), sans-serif;
          flex-shrink: 0;
        }
        .sf-org-title {
          font-size: 13px; font-weight: 600; color: #e4e4e7;
          margin: 0 0 2px;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .sf-org-sub {
          font-size: 10px; color: #52525b; margin: 0;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .connect-btn {
          background: transparent; border: none;
          color: #3B8BFF; font-size: 12px; font-weight: 700;
          cursor: pointer; white-space: nowrap;
          font-family: var(--font-dm-sans), sans-serif;
          transition: color 0.15s;
        }
        .connect-btn:hover { color: #60a5fa; }
      `}</style>
    </>
  );
}