import { Check, X } from "lucide-react";

export function HomeSheet({
  title,
  children,
  onClose,
  onConfirm,
  variant = "light",
  panelClassName = "",
  bodyClassName = "",
  fixedHeight,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  onConfirm?: () => void;
  variant?: "light" | "dark";
  panelClassName?: string;
  bodyClassName?: string;
  fixedHeight?: string;
}) {
  const dark = variant === "dark";
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/40" onClick={onClose}>
      <div
        className={`w-full rounded-t-3xl px-4 pb-6 pt-3 shadow-xl ${dark ? "text-white" : ""} ${fixedHeight ? "flex flex-col" : ""} ${panelClassName}`}
        style={{ ...(fixedHeight ? { height: fixedHeight } : {}), background: dark ? "#1C1C1E" : "#FFFFFF" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0">
          <div className={`mx-auto mb-4 h-1 w-10 rounded-full ${dark ? "bg-white/25" : "bg-gray-300"}`} />
          <div className="mb-4 flex items-center justify-between">
            {onConfirm ? (
              <button type="button" onClick={onClose} className={`flex h-9 w-9 items-center justify-center rounded-full ${dark ? "bg-white/10" : "bg-gray-100"}`} aria-label="Закрыть">
                <X size={17} strokeWidth={2} color={dark ? "#fff" : "#6B7280"} />
              </button>
            ) : <div className="w-9" />}
            <h3 className={`text-[17px] font-semibold ${dark ? "text-white" : "text-gray-900"}`}>{title}</h3>
            {onConfirm ? (
              <button type="button" onClick={onConfirm} className="flex h-9 w-9 items-center justify-center rounded-full bg-white" aria-label="Готово">
                <Check size={18} strokeWidth={2.5} color="#111" />
              </button>
            ) : (
              <button type="button" onClick={onClose} className={`flex h-8 w-8 items-center justify-center rounded-full ${dark ? "bg-white/10" : "bg-gray-100"}`} aria-label="Закрыть">
                <X size={16} strokeWidth={2} color={dark ? "#fff" : "#6B7280"} />
              </button>
            )}
          </div>
        </div>
        <div className={`${fixedHeight ? "min-h-0 flex-1 overflow-y-auto overscroll-contain" : ""} ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}
