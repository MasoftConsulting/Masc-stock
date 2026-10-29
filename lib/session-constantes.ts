/**
 * Constantes de session partagées entre le proxy (Edge runtime)
 * et session.ts (Node runtime).
 *
 * ⚠️ Ne jamais importer autre chose que des constantes ici : le proxy
 * tourne en Edge runtime et ne supporte pas `node:crypto` & co.
 */

export const COOKIE = "masc_stock";

/** Durée d'inactivité avant déconnexion automatique. */
export const DUREE_INACTIVITE_MINUTES = 30; // 2 heures

/** Durée absolue maximale d'une session (sécurité). */
export const DUREE_MAX_JOURS = 30;

/** On renouvelle le cookie seulement quand l'expiration est proche. */
export const MARGE_RENOUVELLEMENT_MINUTES = 30;

/** Longueur minimale du SESSION_SECRET accepté. */
export const SESSION_SECRET_MIN_LENGTH = 32;