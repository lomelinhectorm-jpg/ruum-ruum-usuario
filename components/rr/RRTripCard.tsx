import { Car, Wallet } from "lucide-react";
import { RRCard } from "./RRCard";
import { RRBadge } from "./RRBadge";
import { RRButton } from "./RRButton";
import { formatMoney } from "@/lib/design-system/utils";

interface RRTripCardProps {
  folio?: string;
  status: string;
  origin: string;
  destination: string;
  vehicle: string;
  amount: number;
  variant?: "offer" | "active" | "completed";
  onAccept?: () => void;
  onReject?: () => void;
  onPrimaryAction?: () => void;
  primaryActionLabel?: string;
}

export function RRTripCard({
  folio,
  status,
  origin,
  destination,
  vehicle,
  amount,
  variant = "offer",
  onAccept,
  onReject,
  onPrimaryAction,
  primaryActionLabel = "Ver detalle",
}: RRTripCardProps) {
  const badgeVariant = variant === "completed" ? "success" : variant === "active" ? "process" : "pending";

  return (
    <RRCard className={variant === "active" ? "border-rr-primary bg-gradient-to-br from-rr-secondary to-rr-primary text-white" : ""}>
      <div className="mb-4 flex items-start justify-between gap-3">
        <RRBadge variant={badgeVariant}>{status}</RRBadge>
        {folio && <span className={variant === "active" ? "text-xs text-white/60" : "text-xs text-rr-gray500"}>{folio}</span>}
      </div>

      <div className="flex gap-3">
        <div className="flex flex-col items-center pt-1">
          <span className="h-3 w-3 rounded-full bg-rr-success" />
          <span className={variant === "active" ? "my-1 h-10 w-0.5 bg-white/30" : "my-1 h-10 w-0.5 bg-rr-gray200"} />
          <span className="h-3 w-3 rounded-full bg-rr-warning" />
        </div>

        <div className="min-w-0 flex-1">
          <p className={variant === "active" ? "text-xs text-white/60" : "text-xs text-rr-gray500"}>Origen</p>
          <p className="truncate text-sm font-bold">{origin}</p>
          <p className={variant === "active" ? "mt-3 text-xs text-white/60" : "mt-3 text-xs text-rr-gray500"}>Destino</p>
          <p className="truncate text-sm font-bold">{destination}</p>
        </div>
      </div>

      <div className={variant === "active" ? "mt-5 grid grid-cols-2 gap-3 border-t border-white/15 pt-4" : "mt-5 grid grid-cols-2 gap-3 border-t border-rr-gray200 pt-4"}>
        <div className="flex items-center gap-2">
          <Car className={variant === "active" ? "h-4 w-4 text-white/70" : "h-4 w-4 text-rr-gray500"} />
          <span className="truncate text-xs font-medium">{vehicle}</span>
        </div>
        <div className="flex items-center justify-end gap-2">
          <Wallet className={variant === "active" ? "h-4 w-4 text-white/70" : "h-4 w-4 text-rr-success"} />
          <span className="text-sm font-black">{formatMoney(amount)}</span>
        </div>
      </div>

      {variant === "offer" ? (
        <div className="mt-5 grid grid-cols-2 gap-3">
          <RRButton variant="secondary" onClick={onReject}>Rechazar</RRButton>
          <RRButton variant="primary" onClick={onAccept}>Aceptar</RRButton>
        </div>
      ) : (
        <RRButton className="mt-5" variant={variant === "active" ? "secondary" : "primary"} fullWidth onClick={onPrimaryAction}>
          {primaryActionLabel}
        </RRButton>
      )}
    </RRCard>
  );
}
