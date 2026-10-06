import "server-only";
import { z } from "zod";
import { clientSupabase, echecLecture } from "./supabase";
import { listerMouvements } from "./mouvements";
import type { Periode } from "./periode";
import type {
  Client,
  ClientAvecResume,
  LigneFicheClient,
  MouvementAvecDetails,
  ResumeLivraisons,
} from "./types-stock";

export type { Client, ClientAvecResume, LigneFicheClient };

/** Table `clients` de masc-fiche (base partagée) : lecture seule ici. */
const TABLE = "clients";

const RESUME_VIDE: ResumeLivraisons = {
  nb_livraisons: 0,
  unites: 0,
  nb_produits: 0,
  derniere_livraison: null,
};

export async function listerClients(): Promise<Client[]> {
  const { data, error } = await clientSupabase()
    .from(TABLE)
    .select("*")
    .order("nom");

  if (error) echecLecture("clients", error);
  return data as Client[];
}

/** Tous les clients, avec leurs livraisons sur la période. */
export async function listerClientsAvecResume(
  periode: Periode,
): Promise<ClientAvecResume[]> {
  const [clients, resumes] = await Promise.all([
    listerClients(),
    resumeLivraisons(periode),
  ]);

  return clients.map((c) => ({ ...c, ...(resumes.get(c.id) ?? RESUME_VIDE) }));
}

/** Livraisons par client sur la période (clients livrés uniquement). */
export async function resumeLivraisons(
  periode: Periode,
): Promise<Map<string, ResumeLivraisons>> {
  const { data, error } = await clientSupabase().rpc("resume_livraisons_clients", {
    p_du: periode.du,
    p_au: periode.au,
  });

  if (error) echecLecture("clients/livraisons", error);
  return new Map(
    (data as (ResumeLivraisons & { client_id: string })[]).map(
      ({ client_id, ...resume }) => [client_id, resume],
    ),
  );
}

/** Un client, ou null si l'identifiant est invalide ou inconnu. */
export async function lireClient(id: string): Promise<Client | null> {
  if (!z.uuid().safeParse(id).success) return null;

  const { data, error } = await clientSupabase()
    .from(TABLE)
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) echecLecture("clients", error);
  return data as Client | null;
}

export type FicheClient = {
  client: Client;
  periode: Periode;
  lignes: LigneFicheClient[];
  livraisons: MouvementAvecDetails[];
  /** Vrai si le détail a été tronqué (la synthèse par produit reste exacte). */
  livraisonsTronquees: boolean;
  totaux: { unites: number; nb_livraisons: number; nb_produits: number };
};

const LIMITE_DETAIL = 1000;

/** Fiche d'inventaire : consommables livrés à un client sur la période. */
export async function lireFicheClient(
  id: string,
  periode: Periode,
): Promise<FicheClient | null> {
  const client = await lireClient(id);
  if (!client) return null;

  const [synthese, livraisons] = await Promise.all([
    clientSupabase().rpc("fiche_client", {
      p_client_id: id,
      p_du: periode.du,
      p_au: periode.au,
    }),
    listerMouvements({
      type: "sortie",
      clientId: id,
      depuis: periode.du ?? undefined,
      jusqua: periode.au ?? undefined,
      limite: LIMITE_DETAIL,
    }),
  ]);

  if (synthese.error) echecLecture("clients/fiche", synthese.error);
  const lignes = synthese.data as LigneFicheClient[];

  return {
    client,
    periode,
    lignes,
    livraisons,
    livraisonsTronquees: livraisons.length >= LIMITE_DETAIL,
    totaux: {
      unites: lignes.reduce((s, l) => s + l.unites, 0),
      nb_livraisons: lignes.reduce((s, l) => s + l.nb_livraisons, 0),
      nb_produits: lignes.length,
    },
  };
}
