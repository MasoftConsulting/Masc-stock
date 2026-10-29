import { NextResponse, type NextRequest } from "next/server";
import { SignJWT, jwtVerify } from "jose";
import {
  COOKIE,
  DUREE_INACTIVITE_MINUTES,
  DUREE_MAX_JOURS,
  MARGE_RENOUVELLEMENT_MINUTES,
  SESSION_SECRET_MIN_LENGTH,
} from "@/lib/session-constantes";

/**
 * Garde d'accès globale + fenêtre glissante.
 *
 * - Toute route hors PUBLIC exige un cookie de session valide.
 * - Le jeton est renouvelé (exp = 2 h) tant que l'utilisateur reste actif.
 * - Durée absolue : 30 jours depuis `auth_time`, même en cas d'activité continue.
 */

const PUBLIC = ["/connexion"];

function redirigerConnexion(request: NextRequest): NextResponse {
  const url = request.nextUrl.clone();
  url.pathname = "/connexion";
  const reponse = NextResponse.redirect(url);
  // Nettoie un éventuel cookie invalide pour éviter qu'il soit rejoué.
  reponse.cookies.delete(COOKIE);
  return reponse;
}

async function signerNouveauJeton(
  authTime: number,
  secret: string,
): Promise<string> {
  return new SignJWT({ authentifie: true, auth_time: authTime })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DUREE_INACTIVITE_MINUTES}m`)
    .sign(new TextEncoder().encode(secret));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (PUBLIC.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  const jeton = request.cookies.get(COOKIE)?.value;
  const secret = process.env.SESSION_SECRET;

  if (!jeton || !secret || secret.length < SESSION_SECRET_MIN_LENGTH) {
    return redirigerConnexion(request);
  }

  try {
    const { payload } = await jwtVerify(
      jeton,
      new TextEncoder().encode(secret),
    );

    const now = Math.floor(Date.now() / 1000);
    const exp = payload.exp ?? 0;

    // `auth_time` doit exister (ancien jeton = force re-login).
    const authTimeRaw = (payload as { auth_time?: unknown }).auth_time;
    if (typeof authTimeRaw !== "number") {
      return redirigerConnexion(request);
    }
    const authTime = authTimeRaw;

    // Durée absolue (30 jours depuis la connexion initiale).
    const ageJours = (now - authTime) / 86400;
    if (ageJours > DUREE_MAX_JOURS) {
      return redirigerConnexion(request);
    }

    const reponse = NextResponse.next();

    // Renouvellement glissant : on ne touche au cookie que si l'expiration
    // est proche, pour éviter une écriture Set-Cookie sur chaque requête.
    const marge = MARGE_RENOUVELLEMENT_MINUTES * 60;
    if (exp - now < marge) {
      const nouveauJeton = await signerNouveauJeton(authTime, secret);
      reponse.cookies.set(COOKIE, nouveauJeton, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: DUREE_INACTIVITE_MINUTES * 60,
      });
    }

    return reponse;
  } catch {
    // Jeton expiré / invalide : redirige comme un anonyme.
    return redirigerConnexion(request);
  }
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};