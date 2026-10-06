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
 * Valide un inventaire physique via la fonction Postgres `valider_inventaire`.
 *
 * On n'envoie que les quantités comptées : l'écart est calculé par la base
 * avec le stock réel au moment de la validation, dans une seule transaction.
 * Retourne le nombre d'ajustements créés.
 */
export async function validerInventaire(
  comptes: { produit_id: string; compte: number }[],
  note: string | null,
): Promise<{ nombre: number } | { erreur: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { data, error } = await supabase.rpc("valider_inventaire", {
    p_comptes: comptes,
    p_note: note,
  });

  if (error) return { erreur: error.message };
  return { nombre: data as number };
}

/**
 * Supprime un ajustement. La base refuse la suppression des entrées et
 * sorties (historique) et toute suppression qui rendrait le stock négatif ;
 * ses messages d'erreur sont rédigés pour être affichés tels quels.
 */
export async function supprimerMouvement(
  id: string,
): Promise<{ erreur?: string }> {
  const supabase = createAdminClient();
  if (!supabase) return { erreur: "Supabase n'est pas configuré." };

  const { error } = await supabase.from(TABLE).delete().eq("id", id);
  return error ? { erreur: error.message } : {};
}