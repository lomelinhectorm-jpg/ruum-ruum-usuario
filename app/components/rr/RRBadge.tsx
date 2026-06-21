import { cn } from "@/lib/design-system/utils";

type RRBadgeVariant = "success" | "process" | "pending" | "danger" | "neutral";

interface RRBadgeProps {
  children: React.ReactNode;
  variant?: RRBadgeVariant;
  pulse?: boolean;
  className?: string;
}

const variants: Record<RRBadgeVariant, string> = {
  success: "bg-rr-successLight text-rr-success",
  process: "bg-rr-traceLight text-rr-traceDeep",
  pending: "bg-rr-warningLight text-rr-warning",
  danger: "bg-rr-dangerLight text-rr-danger",
  neutral: "bg-rr-gray100 text-rr-gray700",
};

const dots: Record<RRBadgeVariant, string> = {
  success: "bg-rr-success",
  process: "bg-rr-trace",
  pending: "bg-rr-warning",
  danger: "bg-rr-danger",
  neutral: "bg-rr-gray500",
};

export function RRBadge({ children, variant = "neutral", pulse, className }: RRBadgeProps) {
  return (
    <span className={cn("inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold", variants[variant], className)}>
      <span className={cn("h-2 w-2 rounded-full", dots[variant], pulse && "animate-pulse")} />
      {children}
    </span>
  );
}
