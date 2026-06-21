import { User } from "lucide-react";
import { RRBadge } from "./RRBadge";

interface RRHeaderProps {
  title?: string;
  subtitle?: string;
  status?: string;
  onProfileClick?: () => void;
}

export function RRHeader({
  title = "RUUM RUUM",
  subtitle = "Conductor certificado",
  status = "Disponible",
  onProfileClick,
}: RRHeaderProps) {
  return (
    <header className="sticky top-0 z-30 bg-rr-secondary px-5 pb-5 pt-5 text-white shadow-rrFloating">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-rrMd bg-rr-primary text-rr-secondary">
            <span className="text-base font-black tracking-tight">RR</span>
          </div>
          <div>
            <p className="font-display text-lg font-bold leading-none tracking-tight">{title}</p>
            <p className="mt-1 text-xs font-medium text-white/60">{subtitle}</p>
          </div>
        </div>
        <button type="button" onClick={onProfileClick} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/15">
          <User className="h-5 w-5" />
        </button>
      </div>
      <div className="mt-5 flex items-center justify-between rounded-rrLg border border-white/10 bg-white/10 p-3">
        <span className="text-xs font-medium text-white/70">Estado operativo</span>
        <RRBadge variant="success" pulse>{status}</RRBadge>
      </div>
    </header>
  );
}
