import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase à privilèges élevés, réservé au code serveur.
 *
 * L'application est mono-utilisateur : toutes les lectures et écritures
 * passent par les Server Actions et Server Components. La clé service_role
 * ne quitte donc jamais le serveur.
 *
 * Une configuration manquante est une erreur de déploiement, pas un cas
 * normal : on lève une exception (affichée par `error.tsx`) plutôt que de
 * laisser croire que la base est vide.
 */
export function clientSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) {
    throw new Error(
      "Supabase n'est pas configuré : renseignez NEXT_PUBLIC_SUPABASE_URL et SUPABASE_SERVICE_ROLE_KEY.",
    );
  }

  return createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * Échec d'une lecture : la page ne peut pas s'afficher correctement, on lève
 * l'erreur pour que `error.tsx` la montre (au lieu d'une liste vide trompeuse).
 */
export function echecLecture(contexte: string, erreur: { message: string }): never {
  throw new Error(`[${contexte}] ${erreur.message}`);
}
