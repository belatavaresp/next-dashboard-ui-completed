"use client";

import { useEffect, useState } from "react";
import {
  isDriveLink,
  isEmbeddableUrl,
  normalizeDriveImageLink,
  normalizeDriveLink,
} from "@/lib/links";

type LinkPreviewProps = {
  url: string;
  /**
   * "link" only offers to open the URL: unlike a document, extra content is any
   * site, so it is neither rewritten for Drive nor embeddable in an iframe.
   */
  kind: "image" | "document" | "link";
};

/**
 * Live preview for the URLs typed into the activity form, so an admin can tell a
 * working link from a broken one before saving.
 */
export default function LinkPreview({ url, kind }: LinkPreviewProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [hasImageError, setHasImageError] = useState(false);

  const trimmed = url.trim();
  const embedUrl =
    kind === "document"
      ? normalizeDriveLink(trimmed)
      : kind === "image"
        ? normalizeDriveImageLink(trimmed)
        : trimmed;

  // A new URL deserves a fresh attempt at loading.
  useEffect(() => {
    setHasImageError(false);
  }, [embedUrl]);

  if (!trimmed) return null;

  if (!isEmbeddableUrl(trimmed)) {
    return (
      <p className="text-xs text-amber-700">
        A URL precisa começar com http://, https:// ou / (arquivo local).
      </p>
    );
  }

  if (kind === "image") {
    return (
      <div className="mt-1 flex flex-col gap-1">
        {hasImageError ? (
          <p className="text-xs text-amber-700">
            {isDriveLink(trimmed)
              ? "Não foi possível carregar esta imagem do Drive. Confirme que o compartilhamento do arquivo está como \u201cQualquer pessoa com o link\u201d e que ele é uma imagem."
              : "Não foi possível carregar esta imagem. Verifique se a URL aponta direto para o arquivo."}
          </p>
        ) : (
          // Covers are arbitrary admin-provided URLs, so the optimizer is bypassed.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={embedUrl}
            alt="Pré-visualização da capa"
            className="h-24 w-40 rounded-md border border-gray-200 object-cover"
            onError={() => setHasImageError(true)}
          />
        )}
      </div>
    );
  }

  if (kind === "link") {
    return (
      <div className="mt-1">
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block rounded-md bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
        >
          Abrir em nova aba
        </a>
      </div>
    );
  }

  return (
    <div className="mt-1 flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() => setIsOpen((open) => !open)}
          className="rounded-md bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600 hover:bg-zinc-200"
        >
          {isOpen ? "Ocultar pré-visualização" : "Pré-visualizar"}
        </button>
        <a
          href={embedUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-xs text-[#12960b] hover:underline"
        >
          Abrir em nova aba
        </a>
      </div>

      {isOpen && (
        <iframe
          src={embedUrl}
          title="Pré-visualização do material"
          className="h-96 w-full rounded-md border border-gray-200"
        />
      )}
    </div>
  );
}
