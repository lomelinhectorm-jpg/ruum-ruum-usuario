import { LucideIcon } from "lucide-react";
import { RRCard } from "./RRCard";
import { cn } from "@/lib/design-system/utils";

interface RRStatCardProps {
  label: string;
  value: string | number;
  helper?: string;
  icon?: LucideIcon;
  tone?: "primary" | "success" | "warning" | "dark" | "neutral";
}

const tones = {
  primary: "bg-rr-primaryLight text-rr-primary",
  success: "bg-rr-successLight text-rr-success",
  warning: "bg-rr-warningLight text-rr-warning",
  dark: "bg-rr-secondary text-white",
  neutral: "bg-rr-gray100 text-rr-gray700",
};

export function RRStatCard({ label, value, helper, icon: Icon, tone = "neutral" }: RRStatCardProps) {
  return (
    <RRCard className="p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium text-rr-gray500">{label}</p>
          <p className="mt-1 text-2xl font-black tracking-tight text-rr-black">{value}</p>
          {helper && <p className="mt-1 text-xs text-rr-gray500">{helper}</p>}
        </div>
        {Icon && (
          <div className={cn("flex h-10 w-10 items-center justify-center rounded-rrSm", tones[tone])}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </RRCard>
  );
}
