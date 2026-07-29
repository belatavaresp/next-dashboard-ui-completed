"use client";

import Link from "next/link";

/** Shared chrome for the admin create/edit pages. */
export function FormShell({
  title,
  description,
  backHref,
  children,
}: {
  title: string;
  description?: string;
  backHref: string;
  children: React.ReactNode;
}) {
  return (
    // The outer padding is what keeps the card off the screen edges, so the card
    // itself only needs centering and a cap on very wide monitors.
    <div className="p-4 sm:p-6">
      <div className="mx-auto w-full max-w-7xl bg-white p-6 rounded-md">
        <div className="flex items-start justify-between gap-4 mb-6">
          <div>
            <h1 className="text-lg font-semibold">{title}</h1>
            {description && <p className="text-sm text-gray-500">{description}</p>}
          </div>
          <Link
            href={backHref}
            className="rounded-lg bg-white px-4 py-2 shadow-md hover:bg-zinc-100 text-zinc-500 text-sm"
          >
            Voltar
          </Link>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string;
  hint?: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-sm font-medium text-gray-700">{label}</span>
      {children}
      {hint && !error && <span className="text-xs text-gray-500">{hint}</span>}
      {error && <span className="text-xs text-red-600">{error}</span>}
    </label>
  );
}

export const inputClass = "border p-2 rounded-md w-full";

export function SubmitButton({
  isSubmitting,
  label,
}: {
  isSubmitting: boolean;
  label: string;
}) {
  return (
    <button
      type="submit"
      disabled={isSubmitting}
      className="rounded-md bg-tlpLightGreen p-2 text-black disabled:opacity-60"
    >
      {isSubmitting ? "Salvando..." : label}
    </button>
  );
}
