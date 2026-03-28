"use client";

import * as React from "react";
import { Switch as SwitchPrimitive } from "@base-ui/react/switch";

import { cn } from "@/lib/utils";

export interface SwitchProps extends Omit<React.ComponentProps<typeof SwitchPrimitive.Root>, "children"> {
  /** Gắn id cho label htmlFor */
  id?: string;
}

function Switch({ className, id, checked, onCheckedChange, disabled, ...props }: SwitchProps) {
  return (
    <SwitchPrimitive.Root
      id={id}
      checked={checked}
      onCheckedChange={onCheckedChange}
      disabled={disabled}
      className={cn(
        "group peer inline-flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full border border-border bg-muted px-1 transition-colors",
        "data-[checked]:border-primary data-[checked]:bg-primary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        "disabled:cursor-not-allowed disabled:opacity-50",
        className
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        className={cn(
          "pointer-events-none block size-5 translate-x-0 rounded-full bg-background shadow-sm ring-1 ring-border transition-transform duration-200 ease-out will-change-transform",
          "group-data-[checked]:translate-x-5"
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
