import "server-only";
import { clientSupabase } from "./supabase";
import type { ActionJournal, EntreeJournal } from "./types-stock";

const TABLE_JOURNAL = "journal";

/** Auteur unique — mono-utilisateur, cohérent avec les autres apps MASC. */
const ACTEUR_NOM = "Administrateur";

type EntreeJournalInput = {
  action: ActionJournal;
  table_cible: "bons_livraison" | "produits" | "categories" | "mouvements";
  ligne_id?: string | null;
  details?: Record<string, unknown> | null;
};

/**
 * Insère une entrée d'audit. **Ne jette jamais** : si l'insertion échoue,
 * l'action métier continue sans casser.
 */
export async function enregistrerJournal(entree: EntreeJournalInput): Promise<void> {
  try {
    const { error } = await clientSupabase().from(TABLE_JOURNAL).insert({
      action: entree.action,
      table_cible: entree.table_cible,
      ligne_id: entree.ligne_id ?? null,
      acteur_id: null,
      acteur_nom: ACTEUR_NOM,
      details: entree.details ?? null,
    });
    if (error) {
      console.error("[journal] enregistrerJournal", error.message);
    }
  } catch (e) {
    console.error("[journal] enregistrerJournal exception", e);
  }
}

export async function listerJournal(
  options: { limite?: number; tableCible?: string | null } = {},
): Promise<EntreeJournal[]> {
  const limite = options.limite ?? 200;

  let requete = clientSupabase()
    .from(TABLE_JOURNAL)
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limite);

  if (options.tableCible) {
    requete = requete.eq("table_cible", options.tableCible);
  }

  const { data, error } = await requete;

  if (error) {
    console.error("[journal] listerJournal", error.message);
    return [];
  }

  return (data ?? []) as EntreeJournal[];
}