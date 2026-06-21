import { Camera, Check, Loader2 } from "lucide-react";
import { cn } from "@/lib/design-system/utils";

interface EvidenceItem {
  id: string;
  label: string;
  completed?: boolean;
  previewUrl?: string;
  subiendo?: boolean;
}

interface RREvidenceGalleryProps {
  items?: EvidenceItem[];
  onSelect?: (id: string) => void;
}

const defaultItems: EvidenceItem[] = [
  { id: "front", label: "Frente" },
  { id: "driver", label: "Lado conductor" },
  { id: "rear", label: "Trasera" },
  { id: "passenger", label: "Lado copiloto" },
  { id: "dashboard", label: "Tablero" },
];

export function RREvidenceGallery({ items = defaultItems, onSelect }: RREvidenceGalleryProps) {
  return (
    <div>
      <div className="mb-3">
        <p className="text-sm font-black text-rr-black">Evidencia fotográfica</p>
        <p className="text-xs text-rr-gray500">Captura los ángulos obligatorios del vehículo.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            disabled={item.subiendo}
            onClick={() => onSelect?.(item.id)}
            className={cn(
              "relative flex min-h-[120px] flex-col items-center justify-center overflow-hidden rounded-rrLg border-2 border-dashed p-4 transition",
              item.previewUrl
                ? "border-rr-success bg-rr-successLight text-rr-success"
                : "border-rr-gray200 bg-white text-rr-gray500 hover:border-rr-primary hover:bg-rr-primaryLight"
            )}
          >
            {item.previewUrl && (
              <img src={item.previewUrl} alt={item.label} className="absolute inset-0 h-full w-full object-cover opacity-80" />
            )}
            <span className="relative z-10 flex flex-col items-center">
              {item.subiendo
                ? <Loader2 className="mb-2 h-6 w-6 animate-spin" />
                : item.previewUrl
                  ? <Check className="mb-2 h-6 w-6" />
                  : <Camera className="mb-2 h-6 w-6" />
              }
              <span className={cn("text-xs font-bold", item.previewUrl && "drop-shadow-sm")}>{item.label}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}