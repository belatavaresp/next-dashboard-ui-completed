import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/**
 * Serves a public Google Drive image through this origin.
 *
 * Drive redirects thumbnail requests to lh3.googleusercontent.com, which answers
 * 429 to hotlinked browser requests, so a cover pointing straight at Drive fails
 * intermittently for everyone. Fetching server-side avoids that and lets the
 * response be cached here instead of hitting Drive once per visitor.
 *
 * Only a Drive file id is accepted, never a caller-supplied URL, so this cannot
 * be used to probe arbitrary hosts.
 */
const FILE_ID = /^[A-Za-z0-9_-]{10,128}$/;
const DAY_IN_SECONDS = 60 * 60 * 24;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ fileId: string }> }
) {
  // Covers are only shown to signed-in users; keep the proxy equally private.
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  }

  const { fileId } = await params;
  if (!FILE_ID.test(fileId)) {
    return NextResponse.json({ error: "Identificador inválido" }, { status: 400 });
  }

  let upstream: Response;
  try {
    upstream = await fetch(
      `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`,
      {
        // No cookies, no browser Referer: this is what keeps Drive from rate limiting.
        headers: { Accept: "image/*" },
        next: { revalidate: DAY_IN_SECONDS },
      }
    );
  } catch {
    return NextResponse.json({ error: "Falha ao buscar a imagem" }, { status: 502 });
  }

  const contentType = upstream.headers.get("content-type") ?? "";

  // Drive answers 200 with an HTML page when a file is private or missing.
  if (!upstream.ok || !contentType.startsWith("image/")) {
    return NextResponse.json(
      { error: "Imagem indisponível no Drive" },
      { status: 404 }
    );
  }

  return new NextResponse(upstream.body, {
    headers: {
      "Content-Type": contentType,
      "Cache-Control": `private, max-age=${DAY_IN_SECONDS}`,
    },
  });
}
