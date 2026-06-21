"use client";

import { Car, Home, Settings, Wallet } from "lucide-react";
import {
  RRBadge,
  RRBottomNav,
  RRButton,
  RRCard,
  RREvidenceGallery,
  RRHeader,
  RRInput,
  RRStatCard,
  RRTripCard,
  RRTimeline,
} from "@/components/rr";
import { useState } from "react";

type View = "panel" | "viajes" | "ganancias" | "config";

const items = [
  { id: "panel" as View, label: "Panel", icon: Home },
  { id: "viajes" as View, label: "Viajes", icon: Car },
  { id: "ganancias" as View, label: "Ganancias", icon: Wallet },
  { id: "config" as View, label: "Config.", icon: Settings },
];

export default function DesignSystemDemoPage() {
  const [active, setActive] = useState<View>("panel");

  return (
    <main className="rr-app-shell rr-safe-bottom mx-auto min-h-screen max-w-md">
      <RRHeader />

      <section className="rr-fade-in space-y-5 p-5">
        <RRTripCard
          variant="active"
          folio="RR-2408"
          status="Traslado en curso"
          origin="Santa Fe, CDMX"
          destination="Toluca, Edo. Méx."
          vehicle="Nissan Versa · ABC-123"
          amount={1850}
          primaryActionLabel="Continuar viaje"
        />

        <div className="grid grid-cols-2 gap-3">
          <RRStatCard label="Esta semana" value="$8,750" helper="5 viajes" icon={Wallet} tone="success" />
          <RRStatCard label="Pendientes" value="3" helper="Por aceptar" icon={Car} tone="primary" />
        </div>

        <RRCard>
          <div className="mb-4 flex items-center justify-between">
            <h2 className="text-lg font-black text-rr-black">Componentes</h2>
            <RRBadge variant="process">RDS 1.0</RRBadge>
          </div>

          <div className="space-y-3">
            <RRInput label="Kilometraje" placeholder="45820" />
            <RRButton fullWidth>Acción principal</RRButton>
            <RRButton fullWidth variant="secondary">Acción secundaria</RRButton>
          </div>
        </RRCard>

        <RRCard>
          <RREvidenceGallery
            items={[
              { id: "front", label: "Frente", completed: true },
              { id: "driver", label: "Lado conductor", completed: true },
              { id: "rear", label: "Trasera" },
              { id: "passenger", label: "Lado copiloto" },
              { id: "dashboard", label: "Tablero" },
            ]}
          />
        </RRCard>

        <RRCard>
          <RRTimeline
            steps={[
              { label: "Viaje aceptado", status: "done" },
              { label: "Llegada al origen", status: "done" },
              { label: "Evidencia inicial", status: "current" },
              { label: "Traslado en curso", status: "pending" },
              { label: "Entrega final", status: "pending" },
            ]}
          />
        </RRCard>
      </section>

      <RRBottomNav active={active} items={items} onChange={setActive} />
    </main>
  );
}
