import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";

/**
 * Session mono-utilisateur.
 *
 * Un seul code d'accès (CODE_STOCK dans .env.local) ouvre la session. Pas de
 * MFA : tu es seul à utiliser l'application. La session tient dans un cookie
 * httpOnly signé HS256, valable 30 jours.
 */

const COOKIE = "masc_stock";
const DUREE_JOURS = 30;

export type Session = {
  authentifie: true;
};

function secret() {
  const valeur = process.env.SESSION_SECRET;
  if (!valeur || valeur.length < 32) return null;
  return valeur;
}

function codeStock() {
  return process.env.CODE_STOCK ?? "";
}

export function sessionConfiguree() {
  return Boolean(secret() && codeStock());
}

/** Comparaison en temps constant (évite l'attaque par chronométrage). */
function memeCode(a: string, b: string) {
  const ta = Buffer.from(a);
  const tb = Buffer.from(b);
  if (ta.length !== tb.length) return false;
  return timingSafeEqual(ta, tb);
}

/** Le code saisi est-il le bon ? */
export function estCodeValide(code: string) {
  const attendu = codeStock();
  return attendu.length > 0 && memeCode(code.trim(), attendu);
}

export async function ouvrirSession() {
  const cle = secret();
  if (!cle) throw new Error("SESSION_SECRET manquant ou trop court");

  const jeton = await new SignJWT({ authentifie: true })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DUREE_JOURS}d`)
    .sign(new TextEncoder().encode(cle));

  const store = await cookies();
  store.set(COOKIE, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_JOURS * 24 * 60 * 60,
  });
}

export async function lireSession(): Promise<Session | null> {
  const cle = secret();
  if (!cle) return null;

  const jeton = (await cookies()).get(COOKIE)?.value;
  if (!jeton) return null;

  try {
    await jwtVerify(jeton, new TextEncoder().encode(cle));
    return { authentifie: true };
  } catch {
    return null;
  }
}

export async function fermerSession() {
  (await cookies()).delete(COOKIE);
}