"use client";
import { AIAgentChat } from "@/components/dashboard/AIAgentChat";

export default function AgentPage() {
  return (
    <div style={{
      padding: "24px",
      maxWidth: "1200px",
      margin: "0 auto"
    }}>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{
          color: "#fff",
          fontSize: "24px",
          fontWeight: "700",
          margin: "0 0 8px",
          fontFamily: "var(--font-syne), sans-serif"
        }}>
          AI Sales Assistant
        </h1>
        <p style={{
          color: "#71717a",
          fontSize: "14px",
          margin: "0",
          lineHeight: "1.5"
        }}>
          Chat with your AI assistant to get personalized sales advice, lead strategies, and product recommendations
        </p>
      </div>

      <AIAgentChat />
    </div>
  );
}