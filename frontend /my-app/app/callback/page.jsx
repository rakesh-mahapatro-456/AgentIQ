"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthCallback() {
  const router = useRouter();
  const [status, setStatus] = useState("Processing authentication...");
  const [error, setError] = useState(null);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const status = urlParams.get("status");
        const access_token = urlParams.get("access_token");
        const instance_url = urlParams.get("instance_url");
        const refresh_token = urlParams.get("refresh_token");
        const error = urlParams.get("error");
        const error_description = urlParams.get("error_description");

        if (error) {
          setError(error_description || error);
          setStatus("Authentication failed");
          return;
        }

        if (status === "authenticated" && access_token) {
          setStatus("Authentication successful! Setting up your session...");

          // Store authentication data in localStorage
          localStorage.setItem("auth_token", access_token);
          localStorage.setItem("instance_url", instance_url || "");
          localStorage.setItem("refresh_token", refresh_token || "");
          localStorage.setItem("is_authenticated", "true");

          setStatus("Authentication successful! Redirecting to dashboard...");
          
          // Redirect to protected dashboard
          setTimeout(() => {
            router.push("/dashboard");
          }, 1500);
        } else {
          setError("Invalid authentication response");
          setStatus("Authentication failed");
        }
      } catch (err) {
        setError(err.message || "An unexpected error occurred");
        setStatus("Authentication failed");
      }
    };

    handleCallback();
  }, [router]);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#06090F",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "var(--font-dm-sans), sans-serif",
      }}
    >
      <div
        style={{
          background: "#09090b",
          border: "1px solid rgba(255,255,255,0.1)",
          borderRadius: "12px",
          padding: "48px",
          maxWidth: "400px",
          width: "100%",
          textAlign: "center",
        }}
      >
        <div style={{ marginBottom: "24px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              margin: "0 auto 16px",
              background: error ? "#ef4444" : "#3B8BFF",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              animation: error ? "none" : "spin 1s linear infinite",
            }}
          >
            {error ? (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            ) : (
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                stroke="white"
                strokeWidth="2"
              >
                <path d="M21 12a9 9 0 11-6.219-8.56"></path>
              </svg>
            )}
          </div>
          <h2
            style={{
              color: "#fff",
              fontSize: "18px",
              fontWeight: "600",
              margin: "0 0 8px",
              fontFamily: "var(--font-syne), sans-serif",
            }}
          >
            AgentIQ Authentication
          </h2>
          <p
            style={{
              color: error ? "#ef4444" : "#52525b",
              fontSize: "14px",
              margin: "0",
              lineHeight: "1.5",
            }}
          >
            {status}
          </p>
          {error && (
            <p
              style={{
                color: "#ef4444",
                fontSize: "12px",
                margin: "12px 0 0",
                opacity: 0.8,
              }}
            >
              {error}
            </p>
          )}
        </div>

        {error && (
          <button
            onClick={() => router.push("/login")}
            style={{
              background: "#3B8BFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              padding: "12px 24px",
              fontSize: "14px",
              fontWeight: "600",
              cursor: "pointer",
              marginTop: "16px",
              fontFamily: "var(--font-dm-sans), sans-serif",
            }}
          >
            Back to Login
          </button>
        )}
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
