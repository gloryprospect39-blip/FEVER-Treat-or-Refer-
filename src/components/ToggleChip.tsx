import { cn } from "@/lib/utils";

export function ToggleChip({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left text-sm font-medium transition-all",
        active
          ? "border-rose-300 bg-rose-50 text-rose-900 shadow-sm ring-2 ring-rose-200"
          : "border-slate-200 bg-slate-50 text-slate-700 hover:border-teal-200 hover:bg-teal-50/50",
      )}
    >
      <span
        className={cn(
          "flex h-9 w-9 shrink-0 items-center justify-center rounded-lg",
          active ? "bg-rose-100 text-rose-700" : "bg-white text-teal-600",
        )}
      >
        {icon}
      </span>
      <span>{label}</span>
    </button>
  );
}
