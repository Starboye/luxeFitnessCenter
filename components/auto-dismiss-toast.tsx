"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

export function AutoDismissToast({ message, tone }: { message: string; tone: "success" | "error" }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [visible, setVisible] = useState(true);

  const nextUrl = useMemo(() => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("status");
    params.delete("error");
    params.delete("detail");
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      setVisible(false);
      if (tone === "success") {
        window.location.replace(nextUrl);
      } else {
        window.history.replaceState(window.history.state, "", nextUrl);
      }
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [nextUrl, tone]);

  if (!visible) {
    return null;
  }

  const isSuccess = tone === "success";

  return (
    <div
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 2000,
        width: "min(420px, calc(100vw - 2rem))",
        borderRadius: 18,
        border: isSuccess ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(239,68,68,0.3)",
        background: isSuccess ? "rgba(5,25,18,0.96)" : "rgba(35,10,10,0.96)",
        color: isSuccess ? "#b7f7de" : "#ffc4c4",
        boxShadow: "0 20px 60px rgba(0,0,0,0.45)",
        padding: "1rem 1.1rem"
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", alignItems: "flex-start" }}>
        <div>
          <div style={{ fontSize: 12, fontWeight: 900, letterSpacing: "0.16em", textTransform: "uppercase", marginBottom: 6 }}>
            {isSuccess ? "Success" : "Failed"}
          </div>
          <div style={{ fontWeight: 800, lineHeight: 1.5 }}>{message}</div>
        </div>
        <button
          type="button"
          aria-label="Close notification"
          onClick={() => {
            setVisible(false);
            if (tone === "success") {
              window.location.replace(nextUrl);
            } else {
              window.history.replaceState(window.history.state, "", nextUrl);
            }
          }}
          style={{ border: "none", background: "transparent", color: "inherit", cursor: "pointer", fontSize: 20, lineHeight: 1, padding: 0 }}
        >
          ×
        </button>
      </div>
    </div>
  );
}
