import "server-only";
import { createAdminClient } from "./supabase";
import type {
  Mouvement,
  MouvementAvecDetails,
  TypeMouvement,
} from "./types-stock";

const TABLE = "mouvements";

export type FiltresMouvements = {
  type?: TypeMouvement | null;
  produitId?: string;
  clientId?: string;
  /** Date ISO de début (incluse). */
  depuis?: string;
  /** Date ISO de fin (incluse). */
  jusqua?: string;
  /** Nombre maximum d'entrées à retourner. Par défaut 200. */
  limite?: number;
};

/* ---------------------------------------------------------------- lecture */

/**
 * Liste des mouvements, la plus récente en tête, avec le nom du produit et
 * du client (jointures à la volée, car PostgREST sait les faire proprement
 * sur des relations déclarées en FK).
 */
export async function listerMouvements(
  filtres: FiltresMouvements = {},
): Promise<MouvementAvecDetails[]> {
  const supabase = createAdminClient();
  if (!supabase) return [];

  const limite = Math.min(filtres.limite ?? 200, 1000);

  let requete = supabase
    .from(TABLE)
    .select(
      "*, produits (reference, nom), clients (nom)",
    )
    .order("date_mouvement", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite);

  if (filtres.type) requete = requete.eq("type", filtres.type);
  if (filtres.produitId) requete = requete.eq("produit_id", filtres.produitId);
  if (filtres.clientId) requete = requete.eq("client_id", filtres.clientId);
  if (filtres.depuis) requete = requete.gte("date_mouvement", filtres.depuis);
  if (filtres.jusqua) requete = requete.lte("date_mouvement", filtres.jusqua);

  const { data, error } = await requete;

  if (error) {
    console.error("[mouvements] listerMouvements", error.message);
    return [];
  }

  type Ligne = Mouvement & {
    produits: { reference: string; nom: string } | null;
    clients: { nom: string } | null;
  };

  return ((data ?? []) as Ligne[]).map((l) => {
    const { produits, clients, ...reste } = l;
    return {
      ...reste,
      produit_reference: produits?.reference ?? "—",
      produit_nom: produits?.nom ?? "Produit supprimé",
      client_nom: clients?.nom ?? null,
    };
  });
}

/**
 * Compte des mouvements sur une période, par type.
 * Utilisé par le tableau de bord.
 */
export async function compterMouvements(depuis?: string): Promise<{
  total: number;
  entrees: number;
  sorties: number;
  ajustements: number;
}> {
  const supabase = createAdminClient();
  const vide = { total: 0, entrees: 0, sorties: 0, ajustements: 0 };
  if (!supabase) return vide;

  const base = () => {
    let q = supabase
      .from(TABLE)
      .select("*", { count: "exact", head: true });
    if (depuis) q = q.gte("date_mouvement", depuis);
    return q;
  };

  const [total, entrees, sorties, ajustements] = await Promise.all([
    base(),
    base().eq("type", "entree"),
    base().eq("type", "sortie"),
    base().eq("type", "ajustement"),
  ]);

  return {
    total: total.count ?? 0,
    entrees: entrees.count ?? 0,
    sorties: sorties.count ?? 0,
    ajustements: ajustements.count ?? 0,
  };
}

/* --------------------------------------------------------------- écriture */

export type ChampsMouvement = {
  date_mouvement: string;
  produit_id: string;
  type: TypeMouvement;
  quantite: number;
  client_id: string | null;
  fournisseur: string | null;
  note: string | null;
};

export async function creerMouvement(
  champs: ChampsMouvement,
): Promise<{ mouvement: Mouvement } | { erreur: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  if (champs.quantite <= 0 && champs.type !== "ajustement") {
    return { erreur: "La quantité doit être supérieure à 0." };
  }

  const { data, error } = await supabase
    .from(TABLE)
    .insert(champs)
    .select("*")
    .single();

  if (error) return { erreur: error.message };
  return { mouvement: data as Mouvement };
}

/**
 * Crée en lot les ajustements d'un inventaire.
 *
 * Un inventaire physique produit autant d'ajustements qu'il y a d'écarts.
 * On les insère d'un coup (une seule requête) puis on journalise côté action.
 */
export async function creerAjustementsInventaire(
  lignes: {
    produit_id: string;
    ecart: number;
    note: string;
  }[],
): Promise<{ nombre: number } | { erreur: string }> {
  if (lignes.length === 0) return { nombre: 0 };

  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const aujourdhui = new Date().toISOString().slice(0, 10);

  const { error } = await supabase.from(TABLE).insert(
    lignes.map((l) => ({
      date_mouvement: aujourdhui,
      produit_id: l.produit_id,
      type: "ajustement",
      quantite: l.ecart, // peut être positif ou négatif
      client_id: null,
      fournisseur: null,
      note: l.note,
    })),
  );

  if (error) return { erreur: error.message };
  return { nombre: lignes.length };
}

/**
 * Supprime un mouvement (uniquement les ajustements — les entrées et sorties
 * sont immuables pour préserver la traçabilité).
 */
export async function supprimerMouvement(
  id: string,
): Promise<{ erreur?: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { data: mouvement } = await supabase
    .from(TABLE)
    .select("type")
    .eq("id", id)
    .maybeSingle();

  if (!mouvement) return { erreur: "Mouvement introuvable." };
  if (mouvement.type !== "ajustement") {
    return {
      erreur:
        "Seuls les ajustements peuvent être supprimés. Les entrées et sorties sont conservées pour l'historique.",
    };
  }

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  return error ? { erreur: error.message } : {};
}