import { X } from "lucide-react";

export function HomeSheet({
  title,
  children,
  onClose,
  panelClassName = "",
  bodyClassName = "",
  fixedHeight,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
  panelClassName?: string;
  bodyClassName?: string;
  fixedHeight?: string;
}) {
  return (
    <div className="absolute inset-0 z-30 flex items-end bg-black/30" onClick={onClose}>
      <div
        className={`w-full rounded-t-3xl bg-white px-4 pt-4 pb-6 shadow-xl ${fixedHeight ? "flex flex-col" : ""} ${panelClassName}`}
        style={fixedHeight ? { height: fixedHeight } : undefined}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex-shrink-0">
          <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-gray-300" />
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-[17px] font-semibold text-gray-900">{title}</h3>
            <button type="button" onClick={onClose} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
              <X size={16} strokeWidth={2} color="#6B7280" />
            </button>
          </div>
        </div>
        <div className={`${fixedHeight ? "min-h-0 flex-1 overflow-y-auto overscroll-contain" : ""} ${bodyClassName}`}>{children}</div>
      </div>
    </div>
  );
}
