import "server-only";
import { clientSupabase, echecLecture, tablesPartagees } from "./supabase";
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
  /** Exclut les mouvements annulés (fiches client). */
  horsAnnules?: boolean;
  /** Nombre maximum d'entrées à retourner. Par défaut 200. */
  limite?: number;
};

/* ---------------------------------------------------------------- lecture */

/**
 * Liste des mouvements, la plus récente en tête, avec le nom du produit
 * (jointure PostgREST, même schéma) et du client (lu à part : `clients` est
 * dans `public`, et PostgREST ne joint pas entre schémas).
 */
export async function listerMouvements(
  filtres: FiltresMouvements = {},
): Promise<MouvementAvecDetails[]> {
  const limite = Math.min(filtres.limite ?? 200, 1000);

  let requete = clientSupabase()
    .from(TABLE)
    .select(
      "*, produits (reference, nom)",
    )
    .order("date_mouvement", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(limite);

  if (filtres.type) requete = requete.eq("type", filtres.type);
  if (filtres.produitId) requete = requete.eq("produit_id", filtres.produitId);
  if (filtres.clientId) requete = requete.eq("client_id", filtres.clientId);
  if (filtres.depuis) requete = requete.gte("date_mouvement", filtres.depuis);
  if (filtres.jusqua) requete = requete.lte("date_mouvement", filtres.jusqua);
  if (filtres.horsAnnules) requete = requete.is("annule_par", null);

  const { data, error } = await requete;

  if (error) echecLecture("mouvements", error);

  type Ligne = Mouvement & {
    produits: { reference: string; nom: string } | null;
  };
  const lignes = data as Ligne[];

  const idsClients = [...new Set(lignes.flatMap((l) => (l.client_id ? [l.client_id] : [])))];
  const nomsClients = new Map<string, string>();
  if (idsClients.length > 0) {
    const clients = await tablesPartagees().from("clients").select("id, nom").in("id", idsClients);
    if (clients.error) echecLecture("mouvements/clients", clients.error);
    for (const c of clients.data) nomsClients.set(c.id, c.nom);
  }

  return lignes.map((l) => {
    const { produits, ...reste } = l;
    return {
      ...reste,
      produit_reference: produits?.reference ?? "—",
      produit_nom: produits?.nom ?? "Produit supprimé",
      client_nom: l.client_id ? (nomsClients.get(l.client_id) ?? null) : null,
    };
  });
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
  const { data, error } = await clientSupabase()
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
  const supabase = clientSupabase();

  const { data, error } = await supabase.rpc("valider_inventaire", {
    p_comptes: comptes,
    p_note: note,
  });

  if (error) return { erreur: error.message };
  return { nombre: data as number };
}

/**
 * Annule un mouvement via la fonction Postgres `annuler_mouvement` : crée
 * l'ajustement inverse et lie les deux. La base refuse une double annulation
 * ou une annulation qui rendrait le stock négatif ; ses messages sont rédigés
 * pour être affichés tels quels.
 */
export async function annulerMouvement(
  id: string,
  motif: string,
): Promise<{ erreur?: string }> {
  const { error } = await clientSupabase().rpc("annuler_mouvement", {
    p_id: id,
    p_motif: motif,
  });
  return error ? { erreur: error.message } : {};
}
