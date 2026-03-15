"use client";
import { useRouter } from "next/navigation";
import { Zap, ArrowRight, CheckCircle } from "lucide-react";

const FEATURES = [
  {
    icon: "○",
    color: "#3B8BFF",
    title: "CRM-native lead fetching",
    desc: "Pull any lead directly from Salesforce with one click. Full contact history, account data, and deal stage automatically loaded.",
  },
  {
    icon: "◈",
    color: "#00E5C3",
    title: "RAG-powered proposals",
    desc: "Retrieves the most relevant product specs, case studies, and pricing from your vector DB to craft hyper-personalized drafts.",
  },
  {
    icon: "✦",
    color: "#a855f7",
    title: "Human-in-the-loop review",
    desc: "Approve, edit, or regenerate any draft before it's pushed back to Salesforce. Full traceability through every LangGraph node.",
  },
  {
    icon: "⟳",
    color: "#3B8BFF",
    title: "Batch CSV processing",
    desc: "Upload hundreds of leads at once and let the agent work through the entire pipeline — research, draft, and update — in minutes.",
  },
  {
    icon: "◉",
    color: "#00E5C3",
    title: "Live thought console",
    desc: "Watch the agent work in real-time. Every API call, RAG retrieval, and LLM decision is streamed step-by-step in the thought console.",
  },
  {
    icon: "⬡",
    color: "#a855f7",
    title: "Enterprise-grade security",
    desc: "All data encrypted at rest and in transit. Salesforce OAuth 2.0 with no credential storage. SOC 2 ready architecture.",
  },
];

const STEPS = [
  { num: "01", title: "Enter lead email",   desc: "Type or search a lead email. AgentIQ fetches the full Salesforce record instantly." },
  { num: "02", title: "Set objective",      desc: "Tell the agent what to focus on — product features, pain points, or a specific deal angle." },
  { num: "03", title: "Agent drafts",       desc: "Watch the agent research, retrieve docs, and write a personalized proposal in seconds." },
  { num: "04", title: "Approve & sync",     desc: "One click to approve and push the final draft back into Salesforce automatically." },
];

const INTEGRATIONS = ["SALESFORCE", "SUPABASE", "LANGGRAPH", "GROQ", "GEMINI"];

export default function LandingPage() {
  const router = useRouter();

  return (
    <>
      <div className="landing" style={{ height: "100dvh", overflowY: "auto", overflowX: "hidden" }}>

        {/* ══ NAV ══ */}
        <nav className="nav">
          <div className="nav-inner">
            <div className="nav-logo">
              <div className="logo-icon">
                <Zap size={14} style={{ fill: "white", color: "white" }} />
              </div>
              <span className="logo-text">Agent<span style={{ color: "#00E5C3" }}>IQ</span></span>
            </div>

            <div className="nav-links">
              {["Features", "How it works"].map((l) => (
                <a key={l} className="nav-link">{l}</a>
              ))}
            </div>

            <div className="nav-actions">
              <button className="signin-btn" onClick={() => router.push("/login")}>Sign in</button>
              <button className="getstarted-btn" onClick={() => router.push("/login")}>Get started</button>
            </div>
          </div>
        </nav>

        {/* ══ HERO ══ */}
        <section className="hero">
          <div className="hero-inner">
            <div className="hero-badge">
              <span className="badge-dot" />
              Now with LangGraph multi-agent support
            </div>

            <h1 className="hero-title">
              Your Salesforce CRM,<br />
              <span className="hero-accent">Now Thinks<br />for Itself.</span>
            </h1>

            <p className="hero-sub">
              AgentIQ is an agentic AI workforce that automates lead research,
              drafts personalized proposals, and updates Salesforce — all without
              lifting a finger.
            </p>

            <div className="hero-btns">
              <button className="primary-btn" onClick={() => router.push("/login")}>
                <Zap size={14} style={{ fill: "white", color: "white" }} />
                Launch the agent
              </button>
              <button className="ghost-btn">View live demo</button>
            </div>

            {/* Stats */}
            <div className="stats-row">
              <div className="stat">
                <span className="stat-num">10<span className="stat-x">X</span></span>
                <span className="stat-label">Faster lead research</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">94<span className="stat-x">%</span></span>
                <span className="stat-label">Proposal acceptance rate</span>
              </div>
              <div className="stat-divider" />
              <div className="stat">
                <span className="stat-num">0</span>
                <span className="stat-label">Manual CRM updates</span>
              </div>
            </div>
          </div>
        </section>

        {/* ══ INTEGRATIONS ══ */}
        <section className="integrations">
          <p className="integrates-label">Integrates seamlessly with</p>
          <div className="integrations-row">
            {INTEGRATIONS.map((name) => (
              <div key={name} className="integration-chip">{name}</div>
            ))}
          </div>
        </section>

        {/* ══ FEATURES ══ */}
        <section className="features-section">
          <div className="section-inner">
            <p className="section-eyebrow">Capabilities</p>
            <h2 className="section-title">
              Everything your sales<br />team needs on autopilot
            </h2>

            <div className="features-grid">
              {FEATURES.map((f) => (
                <div key={f.title} className="feature-card">
                  <div className="feature-icon" style={{ background: `${f.color}18`, border: `1px solid ${f.color}30` }}>
                    <span style={{ color: f.color, fontSize: 16 }}>{f.icon}</span>
                  </div>
                  <h3 className="feature-title">{f.title}</h3>
                  <p className="feature-desc">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ WORKFLOW ══ */}
        <section className="workflow-section">
          <div className="section-inner">
            <p className="section-eyebrow">Workflow</p>
            <h2 className="section-title">
              From CRM lead to<br />approved proposal in 4 steps
            </h2>

            <div className="steps-row">
              {STEPS.map((step, i) => (
                <div key={step.num} className="step-card">
                  <div className="step-num">{step.num}</div>
                  <h3 className="step-title">{step.title}</h3>
                  <p className="step-desc">{step.desc}</p>
                  {i < STEPS.length - 1 && <div className="step-arrow">→</div>}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ CTA ══ */}
        <section className="cta-section">
          <div className="cta-card">
            <h2 className="cta-title">Ready to 10x your sales pipeline?</h2>
            <p className="cta-sub">
              Join the teams using AgentIQ to close deals faster with AI-generated, CRM-native proposals.
            </p>
            <button className="primary-btn large" onClick={() => router.push("/login")}>
              Start free trial →
            </button>
          </div>
        </section>

        {/* ══ FOOTER ══ */}
        <footer className="footer">
          <div className="footer-inner">
            <div className="nav-logo">
              <div className="logo-icon">
                <Zap size={13} style={{ fill: "white", color: "white" }} />
              </div>
              <span className="logo-text" style={{ fontSize: 14 }}>Agent<span style={{ color: "#00E5C3" }}>IQ</span></span>
            </div>
            <p className="footer-copy">
              Built for Next.js 15 Hackathon · © 2025 AgentIQ ·{" "}
              <a className="footer-link" href="#">Landing Page</a>
            </p>
          </div>
        </footer>
      </div>

      <style jsx>{`

        /* ── Base ── */
        .landing {
          background: #06090F;
          color: #e4e4e7;
          font-family: var(--font-dm-sans), sans-serif;
          overflow-x: hidden;
        }

        /* ── Nav ── */
        .nav {
          position: sticky; top: 0; z-index: 50;
          background: rgba(6,9,15,0.85);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255,255,255,0.05);
        }
        .nav-inner {
          max-width: 1200px; margin: 0 auto;
          padding: 0 24px;
          height: 60px;
          display: flex; align-items: center; gap: 40px;
        }
        .nav-logo { display: flex; align-items: center; gap: 8px; text-decoration: none; flex-shrink: 0; }
        .logo-icon {
          width: 28px; height: 28px; background: #3B8BFF;
          border-radius: 7px;
          display: flex; align-items: center; justify-content: center;
        }
        .logo-text {
          font-family: var(--font-syne), sans-serif;
          font-size: 17px; font-weight: 800; color: #fff; letter-spacing: -0.3px;
        }
        .nav-links {
          display: flex; align-items: center; gap: 28px; flex: 1;
        }
        @media (max-width: 640px) { .nav-links { display: none; } }
        .nav-link {
          font-size: 13px; color: #71717a; cursor: pointer;
          transition: color 0.15s; text-decoration: none;
        }
        .nav-link:hover { color: #e4e4e7; }
        .nav-actions { display: flex; align-items: center; gap: 8px; margin-left: auto; flex-shrink: 0; }
        .signin-btn {
          background: transparent; border: none;
          color: #71717a; font-size: 13px; font-weight: 500;
          cursor: pointer; padding: 6px 14px; border-radius: 7px;
          transition: color 0.15s;
          font-family: var(--font-dm-sans), sans-serif;
        }
        .signin-btn:hover { color: #e4e4e7; }
        .getstarted-btn {
          background: #3B8BFF; border: none; border-radius: 7px;
          color: #fff; font-size: 12px; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.06em;
          padding: 7px 16px; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          transition: background 0.15s;
        }
        .getstarted-btn:hover { background: #2a7aff; }

        /* ── Hero ── */
        .hero {
          padding: 100px 24px 80px;
          text-align: center;
          background: radial-gradient(ellipse 80% 50% at 50% -10%, rgba(0,229,195,0.07) 0%, transparent 70%);
        }
        .hero-inner { max-width: 700px; margin: 0 auto; }

        .hero-badge {
          display: inline-flex; align-items: center; gap: 8px;
          background: rgba(255,255,255,0.04);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 20px; padding: 5px 14px;
          font-size: 11px; color: #a1a1aa; font-weight: 500;
          margin-bottom: 32px;
        }
        .badge-dot {
          width: 6px; height: 6px; border-radius: 50%;
          background: #00E5C3; flex-shrink: 0;
        }

        .hero-title {
          font-family: var(--font-syne), sans-serif;
          font-size: clamp(42px, 8vw, 76px);
          font-weight: 800; color: #fff;
          line-height: 1.05; letter-spacing: -2px;
          margin: 0 0 24px;
        }
        .hero-accent { color: #3B8BFF; display: block; }

        .hero-sub {
          font-size: 16px; color: #52525b; line-height: 1.8;
          max-width: 480px; margin: 0 auto 36px;
        }

        .hero-btns {
          display: flex; align-items: center; justify-content: center;
          gap: 12px; flex-wrap: wrap; margin-bottom: 64px;
        }
        .primary-btn {
          display: inline-flex; align-items: center; gap: 8px;
          background: #3B8BFF; border: none; border-radius: 9px;
          color: #fff; font-size: 13px; font-weight: 700;
          padding: 12px 24px; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          transition: background 0.15s, transform 0.1s;
        }
        .primary-btn:hover { background: #2a7aff; }
        .primary-btn:active { transform: scale(0.98); }
        .primary-btn.large { font-size: 14px; padding: 14px 28px; }
        .ghost-btn {
          background: transparent;
          border: 1px solid rgba(255,255,255,0.1);
          border-radius: 9px; color: #a1a1aa;
          font-size: 13px; font-weight: 500;
          padding: 12px 24px; cursor: pointer;
          font-family: var(--font-dm-sans), sans-serif;
          transition: border-color 0.15s, color 0.15s;
        }
        .ghost-btn:hover { border-color: rgba(255,255,255,0.25); color: #e4e4e7; }

        /* Stats */
        .stats-row {
          display: flex; align-items: center; justify-content: center;
          gap: 0; flex-wrap: wrap;
        }
        .stat { text-align: center; padding: 0 40px; }
        @media (max-width: 480px) { .stat { padding: 16px 20px; } }
        .stat-num {
          display: block;
          font-family: var(--font-syne), sans-serif;
          font-size: 36px; font-weight: 800; color: #fff; line-height: 1;
        }
        .stat-x { color: #3B8BFF; }
        .stat-label {
          display: block;
          font-size: 10px; color: #52525b; font-weight: 700;
          text-transform: uppercase; letter-spacing: 0.1em;
          margin-top: 6px;
        }
        .stat-divider {
          width: 1px; height: 40px;
          background: rgba(255,255,255,0.06);
          flex-shrink: 0;
        }
        @media (max-width: 480px) { .stat-divider { display: none; } }

        /* ── Integrations ── */
        .integrations {
          padding: 40px 24px;
          border-top: 1px solid rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.04);
          text-align: center;
        }
        .integrates-label {
          font-size: 9px; font-weight: 700; color: #3f3f46;
          text-transform: uppercase; letter-spacing: 0.2em;
          margin: 0 0 20px;
        }
        .integrations-row {
          display: flex; align-items: center; justify-content: center;
          gap: 10px; flex-wrap: wrap;
        }
        .integration-chip {
          background: rgba(255,255,255,0.03);
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 6px; padding: 7px 18px;
          font-size: 10px; font-weight: 700; color: #52525b;
          letter-spacing: 0.12em;
        }

        /* ── Sections shared ── */
        .section-inner { max-width: 1100px; margin: 0 auto; padding: 0 24px; }
        .section-eyebrow {
          font-size: 9px; font-weight: 700; color: #3B8BFF;
          text-transform: uppercase; letter-spacing: 0.2em;
          margin: 0 0 14px;
        }
        .section-title {
          font-family: var(--font-syne), sans-serif;
          font-size: clamp(28px, 4vw, 40px);
          font-weight: 700; color: #fff; line-height: 1.2;
          letter-spacing: -0.5px; margin: 0 0 48px;
        }

        /* ── Features ── */
        .features-section { padding: 100px 0; }
        .features-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        @media (max-width: 900px) { .features-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 560px) { .features-grid { grid-template-columns: 1fr; } }

        .feature-card {
          background: #0c0c0e;
          border: 1px solid rgba(255,255,255,0.05);
          border-radius: 14px; padding: 24px;
          transition: border-color 0.2s, transform 0.2s;
        }
        .feature-card:hover {
          border-color: rgba(255,255,255,0.1);
          transform: translateY(-2px);
        }
        .feature-icon {
          width: 38px; height: 38px; border-radius: 9px;
          display: flex; align-items: center; justify-content: center;
          margin-bottom: 16px;
        }
        .feature-title {
          font-family: var(--font-syne), sans-serif;
          font-size: 14px; font-weight: 700; color: #e4e4e7;
          margin: 0 0 8px;
        }
        .feature-desc {
          font-size: 12px; color: #52525b; line-height: 1.8; margin: 0;
        }

        /* ── Workflow ── */
        .workflow-section {
          padding: 100px 0;
          background: rgba(255,255,255,0.01);
          border-top: 1px solid rgba(255,255,255,0.04);
          border-bottom: 1px solid rgba(255,255,255,0.04);
        }
        .steps-row {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 24px; position: relative;
        }
        @media (max-width: 900px) { .steps-row { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 480px) { .steps-row { grid-template-columns: 1fr; } }

        .step-card { position: relative; text-align: center; padding: 0 8px; }
        .step-num {
          display: inline-flex; align-items: center; justify-content: center;
          width: 40px; height: 40px; border-radius: 50%;
          background: rgba(59,139,255,0.1);
          border: 1px solid rgba(59,139,255,0.2);
          font-family: var(--font-syne), sans-serif;
          font-size: 11px; font-weight: 800; color: #3B8BFF;
          margin-bottom: 14px;
        }
        .step-title {
          font-family: var(--font-syne), sans-serif;
          font-size: 13px; font-weight: 700; color: #e4e4e7;
          margin: 0 0 8px;
        }
        .step-desc { font-size: 11px; color: #52525b; line-height: 1.8; margin: 0; }
        .step-arrow {
          display: none;
          position: absolute; top: 20px; right: -16px;
          font-size: 18px; color: rgba(255,255,255,0.1);
        }
        @media (min-width: 900px) { .step-arrow { display: block; } }

        /* ── CTA ── */
        .cta-section { padding: 100px 24px; text-align: center; }
        .cta-card {
          max-width: 560px; margin: 0 auto;
          background: #0c0c0e;
          border: 1px solid rgba(255,255,255,0.07);
          border-radius: 20px; padding: 60px 40px;
        }
        @media (max-width: 480px) { .cta-card { padding: 40px 24px; } }
        .cta-title {
          font-family: var(--font-syne), sans-serif;
          font-size: clamp(24px, 4vw, 32px);
          font-weight: 700; color: #fff;
          margin: 0 0 14px; letter-spacing: -0.5px;
        }
        .cta-sub {
          font-size: 13px; color: #52525b; line-height: 1.8;
          margin: 0 0 28px;
        }

        /* ── Footer ── */
        .footer {
          padding: 28px 24px;
          border-top: 1px solid rgba(255,255,255,0.05);
        }
        .footer-inner {
          max-width: 1200px; margin: 0 auto;
          display: flex; align-items: center; justify-content: space-between;
          flex-wrap: wrap; gap: 12px;
        }
        .footer-copy { font-size: 11px; color: #3f3f46; margin: 0; }
        .footer-link { color: #3B8BFF; text-decoration: none; }
        .footer-link:hover { text-decoration: underline; }
      `}</style>
    </>
  );
}