import "server-only";
import { clientSupabase } from "./supabase";
import type { BonLivraison, BonLivraisonAvecDetails, Equipement } from "./types-stock";

const TABLE_BL = "bons_livraison";
const TABLE_LIGNES = "bons_livraison_lignes";

/* ---------------------------------------------------------------- lecture */

export async function listerBonsLivraison(): Promise<(BonLivraison & { client_nom: string })[]> {
  const { data, error } = await clientSupabase()
    .from(TABLE_BL)
    .select("*, clients (nom)")
    .order("date_livraison", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[bl] listerBonsLivraison", error.message);
    return [];
  }

  type Ligne = BonLivraison & { clients: { nom: string } | null };

  return ((data ?? []) as Ligne[]).map((l) => {
    const { clients, ...reste } = l;
    return {
      ...reste,
      client_nom: clients?.nom ?? "Client supprimé",
    };
  });
}

export async function lireBonLivraison(id: string): Promise<BonLivraisonAvecDetails | null> {
  // 1. L'en-tête + client
  const { data: bl, error: errBl } = await clientSupabase()
    .from(TABLE_BL)
    .select("*, clients (nom, adresse)")
    .eq("id", id)
    .maybeSingle();

  if (errBl || !bl) {
    if (errBl) console.error("[bl] lireBonLivraison", errBl.message);
    return null;
  }

  // 2. Les lignes + produits ET les équipements du client en parallèle
  const [lignesRes, equipementsRes] = await Promise.all([
    clientSupabase()
      .from(TABLE_LIGNES)
      .select("*, produits (reference, nom, categorie_id, description, compatibilite, categories (nom))")
      .eq("bl_id", id),
    clientSupabase()
      .from("equipements")
      .select("*")
      .eq("client_id", bl.client_id)
  ]);

  if (lignesRes.error) {
    console.error("[bl] lireBonLivraison - lignes", lignesRes.error.message);
    return null;
  }

  type LigneBrute = typeof lignesRes.data[number] & {
    produits: {
      reference: string;
      nom: string;
      description: string | null;
      compatibilite: string | null;
      categories: { nom: string } | null;
    } | null;
  };

  const lignesFormatees = (lignesRes.data as unknown as LigneBrute[]).map((l) => ({
    ...l,
    produit_reference: l.produits?.reference ?? "—",
    produit_nom: l.produits?.nom ?? "Produit supprimé",
    produit_type: l.produits?.categories?.nom ?? l.produits?.description ?? "Générique",
    produit_compatibilite: l.produits?.compatibilite ?? null,
  }));

  type Entete = BonLivraison & { clients: { nom: string; adresse: string | null } | null };

  return {
    ...(bl as Entete),
    client_nom: (bl as Entete).clients?.nom ?? "Client inconnu",
    client_adresse: (bl as Entete).clients?.adresse ?? "",
    client_equipements: (equipementsRes.data ?? []) as Equipement[],
    lignes: lignesFormatees,
  } as BonLivraisonAvecDetails;
}