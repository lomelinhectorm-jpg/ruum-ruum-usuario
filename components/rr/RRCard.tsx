import { HTMLAttributes } from "react";
import { cn } from "@/lib/design-system/utils";

interface RRCardProps extends HTMLAttributes<HTMLDivElement> {
  elevated?: boolean;
}

export function RRCard({ children, className, elevated = true, ...props }: RRCardProps) {
  return (
    <div
      className={cn(
        "rounded-rrLg border border-rr-gray200 bg-white p-6",
        elevated && "shadow-rrCard",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
