/**
 * Admins naturally paste the /view sharing link that the Drive UI hands them,
 * which embeds nowhere. Drive needs two different rewrites depending on how the
 * link is used, so there is one normalizer per target.
 */
function extractDriveFileId(url: string): string | null {
  return (
    url.match(/drive\.google\.com\/file\/d\/([^/?#]+)/)?.[1] ??
    url.match(/drive\.google\.com\/(?:open|uc|thumbnail)\?(?:[^#]*&)?id=([^&#]+)/)?.[1] ??
    url.match(/(?:drive\.google\.com|lh3\.googleusercontent\.com)\/d\/([^/?#]+)/)?.[1] ??
    // Our own proxy path, so re-saving an unchanged cover is a no-op.
    url.match(/^\/api\/drive-image\/([^/?#]+)/)?.[1] ??
    null
  );
}

/** Documents embed in an iframe only from the /preview form. */
export function normalizeDriveLink(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const fileId = extractDriveFileId(trimmed);
  return fileId ? `https://drive.google.com/file/d/${fileId}/preview` : trimmed;
}

/**
 * Images cannot point at Drive directly. /preview serves an HTML viewer rather
 * than image bytes, and the thumbnail endpoint that does serve bytes redirects to
 * lh3.googleusercontent.com, which answers 429 to hotlinked browser requests. So
 * Drive covers are routed through our own proxy, which fetches server-side.
 */
export function normalizeDriveImageLink(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const fileId = extractDriveFileId(trimmed);
  return fileId ? `/api/drive-image/${fileId}` : trimmed;
}

export function isDriveLink(url: string) {
  return extractDriveFileId(url.trim()) !== null;
}

const IMAGE_EXTENSIONS = /\.(png|jpe?g|gif|webp|avif|svg)(\?|#|$)/i;

export function looksLikeImage(url: string) {
  return IMAGE_EXTENSIONS.test(url.trim());
}

export function isEmbeddableUrl(url: string) {
  const trimmed = url.trim();
  return trimmed.startsWith("/") || /^https?:\/\//i.test(trimmed);
}
