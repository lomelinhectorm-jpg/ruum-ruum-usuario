import { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/design-system/utils";

type RRButtonVariant = "primary" | "secondary" | "success" | "warning" | "danger" | "dark";

interface RRButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: RRButtonVariant;
  fullWidth?: boolean;
}

const variants: Record<RRButtonVariant, string> = {
  primary: "bg-rr-primary text-rr-secondary hover:bg-rr-primaryHover shadow-rrCard",
  secondary: "bg-white text-rr-black border border-rr-gray200 hover:bg-rr-gray100",
  success: "bg-rr-success text-white hover:brightness-95 shadow-rrCard",
  warning: "bg-rr-warning text-rr-secondary hover:brightness-95 shadow-rrCard",
  danger: "bg-rr-danger text-white hover:brightness-95 shadow-rrCard",
  dark: "bg-rr-secondary text-white hover:bg-rr-secondaryLight shadow-rrCard",
};

export function RRButton({
  children,
  className,
  variant = "primary",
  fullWidth,
  disabled,
  ...props
}: RRButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex h-[52px] items-center justify-center gap-2 rounded-rrMd px-5 text-sm font-bold transition-all active:scale-[0.98]",
        variants[variant],
        fullWidth && "w-full",
        disabled && "cursor-not-allowed opacity-60",
        className
      )}
      disabled={disabled}
      {...props}
    >
      {children}
    </button>
  );
}
