"use client";
import { useState, useRef, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { Send, Bot, User, Trash2, MessageCircle, Database, BookOpen } from "lucide-react";

export function AIAgentChat() {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);
  const [availableLeads, setAvailableLeads] = useState([]);
  const [isLoadingLeads, setIsLoadingLeads] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  
  const dispatch = useDispatch();
  const leads = useSelector((state) => state.drafts.items);
  const auth = useSelector((state) => state.auth);
  
  const API_BASE = "http://localhost:8000/api";

  // Manual auth loading to bypass timing issues
  useEffect(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("auth_token");
      const instanceUrl = localStorage.getItem("instance_url");
      const refreshToken = localStorage.getItem("refresh_token");
      const isAuthenticated = localStorage.getItem("is_authenticated") === "true";

      console.log("AI Agent - Manual auth check:", {
        hasToken: !!token,
        hasInstanceUrl: !!instanceUrl,
        isAuthenticated,
        token: token ? token.substring(0, 20) + "..." : "none"
      });

      // Force load auth into Redux if not loaded
      if (token && instanceUrl && isAuthenticated && !auth.token) {
        console.log("AI Agent - Force loading auth into Redux");
        dispatch({ type: 'auth/setAuth', payload: {
          token,
          instanceUrl,
          refreshToken,
          isAuthenticated: true,
          user: null
        }});
      }
    }
  }, [dispatch, auth.token]);

  // Fetch leads when component loads if Redux store is empty AND auth is loaded
  useEffect(() => {
    // Only fetch leads if auth state is loaded and tokens are available
    if (auth.isAuthenticated && auth.token && auth.instanceUrl) {
      if (!leads || leads.length === 0) {
        fetchLeadsFromSalesforce();
      } else {
        setAvailableLeads(leads);
      }
    }
  }, [leads, auth.isAuthenticated, auth.token, auth.instanceUrl]);

  // Update available leads when Redux leads change
  useEffect(() => {
    if (leads && leads.length > 0) {
      setAvailableLeads(leads);
    }
  }, [leads]);

  // Test Salesforce access
  const testSalesforceAccess = async () => {
    const token = auth.token || localStorage.getItem("auth_token");
    const instanceUrl = auth.instanceUrl || localStorage.getItem("instance_url");
    
    if (!token || !instanceUrl) {
      console.log("No tokens for testing");
      return;
    }
    
    try {
      const response = await fetch(`${API_BASE}/salesforce/test-access`, {
        headers: {
          'access_token': token,
          'instance_url': instanceUrl
        }
      });
      
      const data = await response.json();
      console.log("Salesforce access test:", data);
    } catch (error) {
      console.log("Access test failed:", error);
    }
  };

  // Make it globally available
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.testSalesforceAccess = testSalesforceAccess;
    }
  }, [auth.token, auth.instanceUrl]);

  const fetchLeadsFromSalesforce = async () => {
    console.log("fetchLeadsFromSalesforce called");
    console.log("Auth state:", {
      isAuthenticated: auth.isAuthenticated,
      hasToken: !!auth.token,
      hasInstanceUrl: !!auth.instanceUrl,
      token: auth.token ? auth.token.substring(0, 20) + "..." : "none"
    });
    
    // Try direct localStorage tokens as fallback
    const directToken = localStorage.getItem("auth_token");
    const directInstanceUrl = localStorage.getItem("instance_url");
    
    console.log("Direct localStorage check:", {
      hasToken: !!directToken,
      hasInstanceUrl: !!directInstanceUrl,
      token: directToken ? directToken.substring(0, 20) + "..." : "none"
    });
    
    const tokenToUse = auth.token || directToken;
    const instanceUrlToUse = auth.instanceUrl || directInstanceUrl;
    
    if (!tokenToUse || !instanceUrlToUse) {
      console.log("No auth tokens available for fetching leads");
      return;
    }

    setIsLoadingLeads(true);
    try {
      console.log("Fetching leads from Salesforce...");
      const response = await fetch(`${API_BASE}/salesforce/leads`, {
        headers: {
          'access_token': tokenToUse,
          'instance_url': instanceUrlToUse
        }
      });

      console.log("Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("Received data:", data);
        
        if (data.leads && data.leads.length > 0) {
          console.log("Setting available leads:", data.leads);
          setAvailableLeads(data.leads);
          // Also update Redux store
          dispatch({ type: 'drafts/setLeads', payload: data.leads });
        } else {
          console.log("No leads in response");
        }
      } else {
        console.log("Response not OK:", response.statusText);
      }
    } catch (error) {
      console.error("Failed to fetch leads from Salesforce:", error);
    } finally {
      setIsLoadingLeads(false);
    }
  };

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Focus input when component loads
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    const userMessage = {
      role: "user",
      content: inputMessage.trim(),
      timestamp: new Date().toISOString()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage("");
    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/agent-chat/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "access_token": auth.token || "",
          "instance_url": auth.instanceUrl || "",
        },
        body: JSON.stringify({
          message: inputMessage.trim(),
          conversation_history: messages,
          lead_id: selectedLead?.Id,
          context: selectedLead ? `Current lead: ${selectedLead.Name} from ${selectedLead.Company}` : null,
          auth_token: auth.token,
          instance_url: auth.instanceUrl,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setMessages(prev => [...prev, {
          role: "assistant",
          content: data.response,
          timestamp: new Date().toISOString()
        }]);
      } else {
        throw new Error("Failed to get response");
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
        timestamp: new Date().toISOString()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const clearChat = () => {
    setMessages([]);
    setSelectedLead(null);
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  return (
    <div style={{
      background: "#0c0c0e",
      border: "1px solid rgba(255,255,255,0.06)",
      borderRadius: "12px",
      padding: "20px",
      height: "600px",
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Header */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: "16px",
        paddingBottom: "12px",
        borderBottom: "1px solid rgba(255,255,255,0.06)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div style={{
            width: "32px",
            height: "32px",
            borderRadius: "50%",
            background: "rgba(59,139,255,0.15)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <Bot size={16} style={{ color: "#3B8BFF" }} />
          </div>
          <div>
            <h3 style={{
              color: "#fff",
              fontSize: "16px",
              fontWeight: "600",
              margin: "0",
              fontFamily: "var(--font-syne), sans-serif"
            }}>
              AI Sales Assistant
            </h3>
            <p style={{
              color: "#71717a",
              fontSize: "12px",
              margin: "0"
            }}>
              Ask about leads, products, or sales strategies
            </p>
          </div>
        </div>
        <button
          onClick={clearChat}
          style={{
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.1)",
            color: "#71717a",
            borderRadius: "6px",
            padding: "6px 8px",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            gap: "4px",
            fontSize: "12px",
            transition: "all 0.15s"
          }}
          onMouseEnter={(e) => {
            e.target.style.borderColor = "#ef4444";
            e.target.style.color = "#ef4444";
          }}
          onMouseLeave={(e) => {
            e.target.style.borderColor = "rgba(255,255,255,0.1)";
            e.target.style.color = "#71717a";
          }}
        >
          <Trash2 size={12} />
          Clear
        </button>
      </div>

      {/* Messages */}
      <div style={{
        flex: 1,
        overflowY: "auto",
        marginBottom: "16px",
        paddingRight: "8px"
      }}>
        {messages.length === 0 ? (
          <div style={{
            textAlign: "center",
            padding: "40px 20px",
            color: "#71717a"
          }}>
            <MessageCircle size={32} style={{ 
              opacity: 0.3, 
              marginBottom: "12px",
              margin: "0 auto 12px"
            }} />
            <p style={{ margin: "0", fontSize: "14px" }}>
              Start a conversation with your AI sales assistant
            </p>
            <p style={{ margin: "8px 0 0", fontSize: "12px", opacity: 0.7 }}>
              Ask about lead strategies, product features, or sales advice
            </p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "8px",
                  alignItems: "flex-start",
                  ...(message.role === "user" ? { flexDirection: "row-reverse" } : {})
                }}
              >
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: message.role === "user" 
                    ? "rgba(34,197,94,0.15)" 
                    : "rgba(59,139,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0
                }}>
                  {message.role === "user" ? (
                    <User size={12} style={{ color: "#22c55e" }} />
                  ) : (
                    <Bot size={12} style={{ color: "#3B8BFF" }} />
                  )}
                </div>
                <div style={{
                  maxWidth: "70%",
                  background: message.role === "user"
                    ? "rgba(34,197,94,0.1)"
                    : "rgba(255,255,255,0.03)",
                  border: `1px solid ${
                    message.role === "user"
                      ? "rgba(34,197,94,0.2)"
                      : "rgba(255,255,255,0.06)"
                  }`,
                  borderRadius: "8px",
                  padding: "10px 12px"
                }}>
                  <p style={{
                    color: "#e4e4e7",
                    fontSize: "13px",
                    lineHeight: "1.5",
                    margin: "0 0 4px",
                    whiteSpace: "pre-line",
                    wordBreak: "break-word"
                  }}>
                    {message.content}
                  </p>
                  <p style={{
                    color: "#71717a",
                    fontSize: "10px",
                    margin: "0",
                    textAlign: message.role === "user" ? "right" : "left"
                  }}>
                    {formatTimestamp(message.timestamp)}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                <div style={{
                  width: "24px",
                  height: "24px",
                  borderRadius: "50%",
                  background: "rgba(59,139,255,0.15)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Bot size={12} style={{ color: "#3B8BFF" }} />
                </div>
                <div style={{
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "8px",
                  padding: "10px 12px"
                }}>
                  <div style={{
                    display: "flex",
                    gap: "4px",
                    alignItems: "center"
                  }}>
                    <div style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#3B8BFF",
                      animation: "pulse 1.4s infinite ease-in-out"
                    }} />
                    <div style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#3B8BFF",
                      animation: "pulse 1.4s infinite ease-in-out",
                      animationDelay: "0.2s"
                    }} />
                    <div style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#3B8BFF",
                      animation: "pulse 1.4s infinite ease-in-out",
                      animationDelay: "0.4s"
                    }} />
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div style={{
        display: "flex",
        gap: "8px",
        alignItems: "flex-end"
      }}>
        <textarea
          ref={inputRef}
          value={inputMessage}
          onChange={(e) => setInputMessage(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask about lead strategies, product features, or sales advice..."
          disabled={isLoading}
          style={{
            flex: 1,
            minHeight: "40px",
            maxHeight: "100px",
            padding: "10px 12px",
            background: "#09090b",
            border: "1px solid rgba(255,255,255,0.06)",
            borderRadius: "8px",
            color: "#e4e4e7",
            fontSize: "13px",
            resize: "none",
            fontFamily: "inherit",
            outline: "none"
          }}
        />
        <button
          onClick={handleSendMessage}
          disabled={!inputMessage.trim() || isLoading}
          style={{
            background: !inputMessage.trim() || isLoading
              ? "rgba(255,255,255,0.05)"
              : "#3B8BFF",
            border: "none",
            borderRadius: "8px",
            padding: "10px",
            cursor: !inputMessage.trim() || isLoading ? "not-allowed" : "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.15s"
          }}
        >
          <Send size={16} style={{ color: "#fff" }} />
        </button>
      </div>

      <style jsx>{`
        @keyframes pulse {
          0%, 80%, 100% {
            transform: scale(0);
            opacity: 0.5;
          }
          40% {
            transform: scale(1);
            opacity: 1;
          }
        }
        
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
