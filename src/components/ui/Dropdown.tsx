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

function mergeTriggerProps(
  trigger: React.ReactNode,
  open: boolean,
  setOpen: React.Dispatch<React.SetStateAction<boolean>>
): React.ReactNode {
  if (React.isValidElement(trigger)) {
    const el = trigger as React.ReactElement<{
      onClick?: React.MouseEventHandler;
      "aria-expanded"?: boolean;
      "aria-haspopup"?: "menu";
    }>;
    /** Merge into the trigger (e.g. `<Button>`) — avoid an outer `role="button"` wrapper (nested interactive). Keyboard activation uses the native control’s click. */
    return React.cloneElement(el, {
      onClick: (e: React.MouseEvent) => {
        el.props.onClick?.(e);
        setOpen((v) => !v);
      },
      "aria-expanded": open,
      "aria-haspopup": "menu",
    });
  }
  return (
    <button
      type="button"
      className="inline-flex cursor-pointer items-center justify-center rounded-md border-0 bg-transparent p-0 font-inherit text-inherit"
      onClick={() => setOpen((v) => !v)}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          setOpen((v) => !v);
        }
      }}
      aria-expanded={open}
      aria-haspopup="menu"
    >
      {trigger}
    </button>
  );
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
        {mergeTriggerProps(trigger, open, setOpen)}
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

function DropdownItem({ children, className = "", onClick, ...props }: DropdownItemProps) {
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
    >
      {children}
    </div>
  );
}

DropdownItem.displayName = "DropdownItem";

export { Dropdown, DropdownItem };
