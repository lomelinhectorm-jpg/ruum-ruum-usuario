import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/design-system/utils";

export interface RRNavItem<T extends string> {
  id: T;
  label: string;
  icon: LucideIcon;
}

interface RRBottomNavProps<T extends string> {
  active: T;
  items: RRNavItem<T>[];
  onChange: (id: T) => void;
}

export function RRBottomNav<T extends string>({ active, items, onChange }: RRBottomNavProps<T>) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-rr-gray200 bg-white/95 px-2 pb-2 pt-2 shadow-rrFloating backdrop-blur">
      <div className="mx-auto flex max-w-md items-center justify-around">
        {items.map(({ id, label, icon: Icon }) => {
          const isActive = active === id;
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className={cn(
                "flex min-w-16 flex-col items-center gap-1 rounded-rrMd px-3 py-2 text-xs font-bold transition",
                isActive ? "bg-rr-primaryLight text-rr-secondary" : "text-rr-gray500 hover:text-rr-black"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </button>
          );
        })}
      </div>
    </nav>
  );
}
