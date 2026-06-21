import { InputHTMLAttributes, TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/design-system/utils";

interface RRFieldProps {
  label?: string;
  error?: string;
  hint?: string;
}

type RRInputProps = InputHTMLAttributes<HTMLInputElement> & RRFieldProps;

export function RRInput({ label, error, hint, className, ...props }: RRInputProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-rr-gray500">{label}</span>}
      <input
        className={cn(
          "h-14 w-full rounded-rrMd border bg-white px-4 text-sm text-rr-black outline-none transition focus:ring-2",
          error ? "border-rr-danger bg-rr-dangerLight focus:ring-rr-danger/20" : "border-rr-gray200 focus:border-rr-primary focus:ring-rr-primary/20",
          className
        )}
        {...props}
      />
      {hint && !error && <span className="mt-1 block text-xs text-rr-gray500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rr-danger">{error}</span>}
    </label>
  );
}

type RRTextareaProps = TextareaHTMLAttributes<HTMLTextAreaElement> & RRFieldProps;

export function RRTextarea({ label, error, hint, className, ...props }: RRTextareaProps) {
  return (
    <label className="block">
      {label && <span className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-rr-gray500">{label}</span>}
      <textarea
        className={cn(
          "min-h-[120px] w-full rounded-rrMd border bg-white px-4 py-3 text-sm text-rr-black outline-none transition focus:ring-2",
          error ? "border-rr-danger bg-rr-dangerLight focus:ring-rr-danger/20" : "border-rr-gray200 focus:border-rr-primary focus:ring-rr-primary/20",
          className
        )}
        {...props}
      />
      {hint && !error && <span className="mt-1 block text-xs text-rr-gray500">{hint}</span>}
      {error && <span className="mt-1 block text-xs font-medium text-rr-danger">{error}</span>}
    </label>
  );
}
