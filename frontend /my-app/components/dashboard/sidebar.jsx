"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSelector, useDispatch } from "react-redux";
import {
  LayoutDashboard, Zap, FileText, Bot, LogOut,
} from "lucide-react";
import { logout } from "@/store/features/authSlice";

const NAV_ITEMS = [
  { name: "Dashboard",  href: "/dashboard", icon: LayoutDashboard },
  { name: "Batch Mode", href: "/batch",     icon: Zap,  badge: "New" },
  { name: "All Drafts", href: "/drafts",    icon: FileText },
  { name: "AI Agent",   href: "/agent",     icon: Bot },
];

export function Sidebar({ open, collapsed }) {
  const pathname = usePathname();
  const user = useSelector((state) => state.auth.user);
  const dispatch = useDispatch();

  // Get user initials for avatar
  const getUserInitials = (name) => {
    if (!name) return "U";
    const names = name.split(" ");
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return name.substring(0, 2).toUpperCase();
  };

  const handleLogout = () => {
    // Clear localStorage
    if (typeof window !== "undefined") {
      localStorage.removeItem("auth_token");
      localStorage.removeItem("instance_url");
      localStorage.removeItem("refresh_token");
      localStorage.removeItem("is_authenticated");
    }
    
    // Clear Redux state
    dispatch(logout());
    
    // Redirect to login page
    window.location.href = "/login";
  };

  return (
    <aside
      style={{
        width: collapsed ? 0 : 220,
        minWidth: collapsed ? 0 : 220,
        background: "#0c0c0e",
        borderRight: collapsed ? "none" : "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        flexDirection: "column",
        padding: collapsed ? 0 : "16px 12px",
        transition: "width 0.25s ease, min-width 0.25s ease, padding 0.25s ease",
        overflow: "hidden",
        flexShrink: 0,
        height: "100dvh",
        position: typeof window !== "undefined" && window.innerWidth <= 700 ? "fixed" : "relative",
        top: 0, left: 0, zIndex: 50,
        transform: typeof window !== "undefined" && window.innerWidth <= 700
          ? open ? "translateX(0)" : "translateX(-100%)"
          : "none",
      }}
    >
      {/* Logo */}
      <div style={{
        display: "flex", alignItems: "center", gap: 8,
        padding: "4px 8px 16px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        marginBottom: 4, whiteSpace: "nowrap",
      }}>
        <div style={{
          width: 26, height: 26, background: "#3B8BFF",
          borderRadius: 6, display: "flex", alignItems: "center", justifyContent: "center",
          flexShrink: 0,
        }}>
          <Zap size={14} style={{ fill: "white", color: "white" }} />
        </div>
        <span style={{
          fontFamily: "var(--font-syne), sans-serif",
          fontSize: 16, fontWeight: 800, color: "#fff", letterSpacing: "-0.3px",
        }}>
          AgentIQ
        </span>
      </div>

      {/* Nav */}
      <div style={{ marginTop: 16 }}>
        <p style={{
          fontSize: 9, fontWeight: 700, color: "#52525b",
          textTransform: "uppercase", letterSpacing: "0.15em",
          padding: "0 8px", marginBottom: 6,
        }}>Workspace</p>

        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link key={item.name} href={item.href} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "7px 8px", borderRadius: 7,
              fontSize: 13, fontWeight: 500,
              color: active ? "#3B8BFF" : "#71717a",
              background: active ? "rgba(59,139,255,0.12)" : "transparent",
              textDecoration: "none",
              transition: "all 0.15s",
              whiteSpace: "nowrap", gap: 6, marginBottom: 2,
            }}>
              <span style={{ display: "flex", alignItems: "center", gap: 9 }}>
                <item.icon size={15} />
                {item.name}
              </span>
              {item.badge && (
                <span style={{
                  fontSize: 8, fontWeight: 700,
                  background: "#3B8BFF", color: "#fff",
                  padding: "2px 6px", borderRadius: 20,
                  textTransform: "uppercase",
                }}>
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
      </div>

      {/* Footer — user card with logout button */}
      <div style={{
        marginTop: "auto",
        paddingTop: 12,
        borderTop: "1px solid rgba(255,255,255,0.06)",
      }}>
        <div style={{
          background: "rgba(255,255,255,0.03)",
          border: "1px solid rgba(255,255,255,0.06)",
          borderRadius: 9, padding: 10,
          display: "flex", alignItems: "center", gap: 10,
        }}>
          <div style={{
            width: 30, height: 30, borderRadius: "50%",
            background: "rgba(59,139,255,0.15)", color: "#3B8BFF",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontFamily: "var(--font-syne), sans-serif",
            fontSize: 10, fontWeight: 700, flexShrink: 0,
          }}>
            {getUserInitials(user?.Name)}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 600, color: "#e4e4e7", lineHeight: 1.3, margin: 0 }}>
              {user?.Name || "Loading..."}
            </p>
            <p style={{
              fontSize: 9, color: "#71717a", margin: 0,
              whiteSpace: "nowrap", overflow: "hidden",
              textOverflow: "ellipsis", maxWidth: 120,
            }}>
              {user?.Email || "Loading..."}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{
              background: "transparent",
              border: "none",
              color: "#71717a",
              cursor: "pointer",
              padding: 4,
              borderRadius: 4,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              transition: "all 0.15s",
              flexShrink: 0,
            }}
            onMouseEnter={(e) => {
              e.target.style.color = "#ef4444";
              e.target.style.background = "rgba(239, 68, 68, 0.1)";
            }}
            onMouseLeave={(e) => {
              e.target.style.color = "#71717a";
              e.target.style.background = "transparent";
            }}
            title="Logout"
          >
            <LogOut size={14} />
          </button>
        </div>
      </div>
    </aside>
  );
}