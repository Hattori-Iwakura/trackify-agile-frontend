"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function LabelColorPicker({
  id,
  value,
  onChange,
  className,
}: {
  id: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "h-10 w-full overflow-hidden rounded-xl border border-border bg-background shadow-sm",
        className
      )}
    >
      <input
        id={id}
        type="color"
        value={value}
        onChange={onChange}
        className="m-0 box-border h-full w-full min-h-[2.5rem] cursor-pointer appearance-none overflow-hidden rounded-xl border-0 bg-transparent p-0 [&::-moz-color-swatch]:rounded-xl [&::-moz-color-swatch]:border-0 [&::-webkit-color-swatch-wrapper]:rounded-xl [&::-webkit-color-swatch-wrapper]:border-0 [&::-webkit-color-swatch-wrapper]:p-0 [&::-webkit-color-swatch]:rounded-xl [&::-webkit-color-swatch]:border-0"
      />
    </div>
  );
}
