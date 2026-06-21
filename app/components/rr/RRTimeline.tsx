import { Check } from "lucide-react";
import { cn } from "@/lib/design-system/utils";

interface TimelineStep {
  label: string;
  description?: string;
  status: "done" | "current" | "pending";
}

interface RRTimelineProps {
  steps: TimelineStep[];
}

export function RRTimeline({ steps }: RRTimelineProps) {
  return (
    <div>
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1;
        return (
          <div key={step.label} className="flex gap-3">
            <div className="flex flex-col items-center">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border-2 text-xs font-black",
                  step.status === "done" && "border-rr-primary bg-rr-primary text-rr-secondary",
                  step.status === "current" && "border-rr-primary bg-rr-primary text-rr-secondary",
                  step.status === "pending" && "border-rr-gray200 bg-white text-rr-gray500"
                )}
              >
                {step.status === "done" ? <Check className="h-4 w-4" /> : index + 1}
              </div>
              {!isLast && (
                <div
                  className={cn(
                    "h-12 w-0.5",
                    step.status === "done"
                      ? "bg-[linear-gradient(var(--rr-primary)_60%,transparent_0)] bg-[length:2px_10px]"
                      : "bg-rr-gray200"
                  )}
                />
              )}
            </div>

            <div className="pb-6 pt-1">
              <p className="text-sm font-bold text-rr-black">{step.label}</p>
              {step.description && <p className="mt-0.5 text-xs text-rr-gray500">{step.description}</p>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
