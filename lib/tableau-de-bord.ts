import "server-only";
import { clientSupabase, echecLecture } from "./supabase";
import { listerProduitsComplet } from "./produits";
import { listerMouvements } from "./mouvements";
import { listerClientsAvecResume } from "./clients";
import { lirePeriode, type Periode } from "./periode";
import {
  statutStock,
  type ClientAvecResume,
  type MouvementAvecDetails,
  type ProduitAvecStock,
  type TypeMouvement,
} from "./types-stock";

export type ActiviteType = { nb_mouvements: number; unites: number };

export type TableauDeBord = {
  periode: Periode;
  produits: { actifs: number; unites: number; bas: number; rupture: number };
  /** Produits actifs en rupture puis sous le seuil, les plus critiques d'abord. */
  alertes: ProduitAvecStock[];
  activite: Record<TypeMouvement, ActiviteType>;
  meilleursClients: ClientAvecResume[];
  derniersMouvements: MouvementAvecDetails[];
};

const VIDE: ActiviteType = { nb_mouvements: 0, unites: 0 };

async function syntheseMouvements(
  periode: Periode,
): Promise<Record<TypeMouvement, ActiviteType>> {
  const { data, error } = await clientSupabase().rpc("synthese_mouvements", {
    p_du: periode.du,
    p_au: periode.au,
  });
  if (error) echecLecture("tableau-de-bord/mouvements", error);

  const activite = { entree: VIDE, sortie: VIDE, ajustement: VIDE };
  for (const l of data as ({ type: TypeMouvement } & ActiviteType)[]) {
    activite[l.type] = { nb_mouvements: l.nb_mouvements, unites: l.unites };
  }
  return activite;
}

export async function lireTableauDeBord(): Promise<TableauDeBord> {
  const periode = lirePeriode({}, "mois");

  const [produits, activite, clients, derniersMouvements] = await Promise.all([
    listerProduitsComplet(),
    syntheseMouvements(periode),
    listerClientsAvecResume(periode),
    listerMouvements({ limite: 6 }),
  ]);

  const actifs = produits.filter((p) => p.actif);
  const statut = (p: ProduitAvecStock) => statutStock(p.quantite, p.seuil_alerte);
  const alertes = actifs
    .filter((p) => statut(p) !== "ok")
    .sort(
      (a, b) =>
        Number(statut(a) !== "rupture") - Number(statut(b) !== "rupture") ||
        a.quantite - a.seuil_alerte - (b.quantite - b.seuil_alerte),
    );

  return {
    periode,
    produits: {
      actifs: actifs.length,
      unites: actifs.reduce((s, p) => s + p.quantite, 0),
      bas: alertes.filter((p) => statut(p) === "bas").length,
      rupture: alertes.filter((p) => statut(p) === "rupture").length,
    },
    alertes,
    activite,
    meilleursClients: clients
      .filter((c) => c.unites > 0)
      .sort((a, b) => b.unites - a.unites)
      .slice(0, 5),
    derniersMouvements,
  };
}
