"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";

export interface ModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  children: React.ReactNode;
  footer?: React.ReactNode;
  className?: string;
}

function Modal({
  open,
  onOpenChange,
  title,
  children,
  footer,
  className = "",
}: ModalProps) {
  const contentRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onOpenChange(false);
  };

  if (typeof document === "undefined" || !open) return null;

  const modal = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
    >
      <div
        className="absolute inset-0 bg-foreground/40 backdrop-blur-sm transition-opacity"
        onClick={handleOverlayClick}
      />
      <div
        ref={contentRef}
        className={`
          relative z-10 w-full max-w-lg rounded-2xl border border-border bg-background
          shadow-2xl text-foreground overflow-hidden
          ${className}
        `.replace(/\s+/g, " ")}
        onClick={(e) => e.stopPropagation()}
      >
        {title != null && (
          <div className="flex items-center justify-between border-b border-border px-6 py-4 bg-muted/30">
            <h2 id="modal-title" className="text-lg font-semibold text-foreground">
              {title}
            </h2>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              aria-label="Đóng"
              onClick={() => onOpenChange(false)}
              className="h-9 w-9 rounded-full hover:bg-muted"
            >
              ×
            </Button>
          </div>
        )}
        <div className="px-6 py-5 text-sm text-foreground">{children}</div>
        {footer != null && (
          <div className="flex justify-end gap-3 border-t border-border px-6 py-4 bg-muted/20">
            {footer}
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(modal, document.body);
}

Modal.displayName = "Modal";

export { Modal };
