"use client";

import * as React from "react";

const DropdownContext = React.createContext<{ close: () => void } | null>(null);

export interface DropdownProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  contentClassName?: string;
  align?: "left" | "right";
}

function Dropdown({ trigger, children, className = "", contentClassName = "", align = "left" }: DropdownProps) {
  const [open, setOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [open]);

  const close = React.useCallback(() => setOpen(false), []);

  return (
    <DropdownContext.Provider value={{ close }}>
      <div ref={containerRef} className={`relative inline-block ${className}`.replace(/\s+/g, " ")}>
        <div onClick={() => setOpen((v) => !v)} role="button" tabIndex={0} onKeyDown={(e) => e.key === "Enter" && setOpen((v) => !v)}>
          {trigger}
        </div>
        {open && (
          <div
            className={`
              absolute z-50 mt-2 min-w-[10rem] rounded-xl border border-border bg-background py-2 shadow-xl overflow-hidden
              ${align === "right" ? "right-0" : "left-0"}
              ${contentClassName}
            `.replace(/\s+/g, " ")}
            role="menu"
          >
            {children}
          </div>
        )}
      </div>
    </DropdownContext.Provider>
  );
}

Dropdown.displayName = "Dropdown";

export interface DropdownItemProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

function DropdownItem({ className = "", onClick, ...props }: DropdownItemProps) {
  const ctx = React.useContext(DropdownContext);
  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    onClick?.(e);
    ctx?.close();
  };
  return (
    <div
      role="menuitem"
      className={`
        cursor-pointer text-sm text-foreground transition-colors
        ${className}
      `.replace(/\s+/g, " ")}
      onClick={handleClick}
      {...props}
    />
  );
}

DropdownItem.displayName = "DropdownItem";

export { Dropdown, DropdownItem };
