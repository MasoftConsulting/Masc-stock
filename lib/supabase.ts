import "server-only";
import { createClient } from "@supabase/supabase-js";

/**
 * Client Supabase à privilèges élevés, réservé au code serveur.
 *
 * L'application est mono-utilisateur : toutes les lectures et écritures
 * passent par les Server Actions et Server Components. La clé service_role
 * ne quitte donc jamais le serveur.
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cle = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !cle) return null;

  return createClient(url, cle, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export const supabaseConfigure = Boolean(
  process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY,
);