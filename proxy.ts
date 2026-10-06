import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";

/**
 * Garde d'accès globale.
 *
 * Tout ce qui n'est pas /connexion exige un cookie de session valide.
 */

const PUBLIC = ["/connexion"];

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) return NextResponse.next();

  const jeton = request.cookies.get("masc_stock")?.value;
  const secret = process.env.SESSION_SECRET;

  if (jeton && secret && secret.length >= 32) {
    try {
      await jwtVerify(jeton, new TextEncoder().encode(secret));
      return NextResponse.next();
    } catch {
      // Jeton expiré ou invalide : redirige comme un anonyme.
    }
  }

  const url = request.nextUrl.clone();
  url.pathname = "/connexion";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};