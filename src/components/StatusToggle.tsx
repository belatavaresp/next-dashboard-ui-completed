"use client";

import { STATUS_LABELS, type Status } from "@/lib/types";

type StatusToggleProps = {
  status: Status;
  onChange: (next: Status) => void;
  disabled?: boolean;
  /** Off in tables, where the column header already says what this is. */
  showLabel?: boolean;
};

/**
 * Active/inactive switch. Controlled on purpose: the admin lists save on change
 * while the forms only track local state until submit.
 */
export default function StatusToggle({
  status,
  onChange,
  disabled = false,
  showLabel = false,
}: StatusToggleProps) {
  const isActive = status === "active";

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={isActive}
        aria-label={`Status: ${STATUS_LABELS[status]}`}
        title={isActive ? "Ativo — clique para desativar" : "Inativo — clique para ativar"}
        disabled={disabled}
        onClick={() => onChange(isActive ? "inactive" : "active")}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors disabled:opacity-60 ${
          isActive ? "bg-tlpLightGreen" : "bg-zinc-300"
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${
            isActive ? "left-[22px]" : "left-0.5"
          }`}
        />
      </button>
      {showLabel && (
        <span className="text-sm text-gray-700">{STATUS_LABELS[status]}</span>
      )}
    </div>
  );
}
