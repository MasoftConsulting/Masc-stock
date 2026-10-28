import "server-only";
import { clientSupabase, tablesPartagees } from "./supabase";
import type { BonLivraison, BonLivraisonAvecDetails, Equipement } from "./types-stock";

const TABLE_BL = "bons_livraison";
const TABLE_LIGNES = "bons_livraison_lignes";

/* ---------------------------------------------------------------- lecture */

/*
 * `clients` est dans le schéma `public` et les BL dans `stock` : PostgREST ne
 * joint pas entre schémas, le client est donc lu à part.
 */

export async function listerBonsLivraison(): Promise<(BonLivraison & { client_nom: string })[]> {
  const { data, error } = await clientSupabase()
    .from(TABLE_BL)
    .select("*")
    .order("date_livraison", { ascending: false })
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[bl] listerBonsLivraison", error.message);
    return [];
  }

  const bons = (data ?? []) as BonLivraison[];
  const idsClients = [...new Set(bons.map((b) => b.client_id))];
  const nomsClients = new Map<string, string>();
  if (idsClients.length > 0) {
    const clients = await tablesPartagees().from("clients").select("id, nom").in("id", idsClients);
    if (clients.error) console.error("[bl] listerBonsLivraison - clients", clients.error.message);
    for (const c of clients.data ?? []) nomsClients.set(c.id, c.nom);
  }

  return bons.map((b) => ({
    ...b,
    client_nom: nomsClients.get(b.client_id) ?? "Client supprimé",
  }));
}

export async function lireBonLivraison(id: string): Promise<BonLivraisonAvecDetails | null> {
  // 1. L'en-tête
  const { data: bl, error: errBl } = await clientSupabase()
    .from(TABLE_BL)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (errBl || !bl) {
    if (errBl) console.error("[bl] lireBonLivraison", errBl.message);
    return null;
  }

  // 2. Les lignes + produits, le client ET ses équipements en parallèle
  const [lignesRes, clientRes, equipementsRes] = await Promise.all([
    clientSupabase()
      .from(TABLE_LIGNES)
      .select("*, produits (reference, nom, categorie_id, description, compatibilite, categories (nom))")
      .eq("bl_id", id),
    tablesPartagees()
      .from("clients")
      .select("nom, adresse")
      .eq("id", bl.client_id)
      .maybeSingle(),
    tablesPartagees()
      .from("equipements")
      .select("*")
      .eq("client_id", bl.client_id)
  ]);

  if (clientRes.error) console.error("[bl] lireBonLivraison - client", clientRes.error.message);

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

  const client = clientRes.data as { nom: string; adresse: string | null } | null;

  return {
    ...(bl as BonLivraison),
    client_nom: client?.nom ?? "Client inconnu",
    client_adresse: client?.adresse ?? "",
    client_equipements: (equipementsRes.data ?? []) as Equipement[],
    lignes: lignesFormatees,
  } as BonLivraisonAvecDetails;
}