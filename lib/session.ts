import "server-only";
import { timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { SignJWT, jwtVerify } from "jose";
import {
  COOKIE,
  DUREE_INACTIVITE_MINUTES,
  DUREE_MAX_JOURS,
  SESSION_SECRET_MIN_LENGTH,
} from "./session-constantes";

/**
 * Session mono-utilisateur avec expiration sur inactivité.
 *
 * - Cookie httpOnly signé HS256.
 * - `exp` = DUREE_INACTIVITE_MINUTES (2 h), prolongé par le proxy à chaque
 *   requête tant que l'utilisateur est actif.
 * - `auth_time` = date de connexion initiale, pour la durée absolue
 *   DUREE_MAX_JOURS (30 j).
 */

export type Session = { authentifie: true };

type PayloadSession = {
  authentifie: true;
  auth_time: number;
};

function secret() {
  const valeur = process.env.SESSION_SECRET;
  if (!valeur || valeur.length < SESSION_SECRET_MIN_LENGTH) return null;
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

async function signerJeton(authTime: number): Promise<string> {
  const cle = secret();
  if (!cle) throw new Error("SESSION_SECRET manquant ou trop court");

  return new SignJWT({ authentifie: true, auth_time: authTime })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${DUREE_INACTIVITE_MINUTES}m`)
    .sign(new TextEncoder().encode(cle));
}

export async function ouvrirSession() {
  const authTime = Math.floor(Date.now() / 1000);
  const jeton = await signerJeton(authTime);

  const store = await cookies();
  store.set(COOKIE, jeton, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: DUREE_INACTIVITE_MINUTES * 60,
  });
}

export async function lireSession(): Promise<Session | null> {
  const cle = secret();
  if (!cle) return null;

  const jeton = (await cookies()).get(COOKIE)?.value;
  if (!jeton) return null;

  try {
    const { payload } = await jwtVerify(jeton, new TextEncoder().encode(cle));

    const authTime = (payload as unknown as PayloadSession).auth_time;

    // Ancien jeton (avant migration) → force re-login une seule fois.
    if (typeof authTime !== "number") return null;

    // Durée absolue
    const ageJours = (Date.now() / 1000 - authTime) / 86400;
    if (ageJours > DUREE_MAX_JOURS) return null;

    return { authentifie: true };
  } catch {
    return null;
  }
}

export async function fermerSession() {
  (await cookies()).delete(COOKIE);
}