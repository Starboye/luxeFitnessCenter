"use client";

import { useEffect } from "react";

export function StatusPopup({
  open,
  title,
  message,
  tone,
  onClose
}: {
  open: boolean;
  title: string;
  message: string;
  tone: "success" | "warning" | "danger";
  onClose: () => void;
}) {
  useEffect(() => {
    if (!open) {
      return;
    }

    const timeout = window.setTimeout(onClose, 3000);
    return () => window.clearTimeout(timeout);
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  return (
    <div className="overlay-status">
      <div className="modal-card">
        <span className={`status status--${tone}`}>{title}</span>
        <strong>{title}</strong>
        <div className="muted">{message}</div>
      </div>
    </div>
  );
}
