/**
 * Types et fonctions partagés, utilisables côté serveur ET côté navigateur.
 *
 * Ce fichier ne contient AUCUNE dépendance à la base de données — c'est ce qui
 * permet aux Client Components de l'importer sans embarquer Supabase dans le
 * bundle navigateur.
 */

/* ------------------------------------------------------------- catégories */

export type Categorie = {
  id: string;
  nom: string;
  description: string | null;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type CategorieAvecStats = Categorie & {
  nb_produits: number;
};

/* --------------------------------------------------------------- produits */

export type Produit = {
  id: string;
  reference: string;
  nom: string;
  categorie_id: string | null;
  description: string | null;
  /** Modèles d'imprimantes compatibles, texte libre (« BP-70C31, BP-70C36 »). */
  compatibilite: string | null;
  seuil_alerte: number;
  actif: boolean;
  created_at: string;
  updated_at: string;
};

export type ProduitAvecStock = Produit & {
  quantite: number;
  categorie_nom: string | null;
};

export type ChampsProduit = {
  reference: string;
  nom: string;
  categorie_id: string | null;
  description: string | null;
  compatibilite: string | null;
  seuil_alerte: number;
};

/* ------------------------------------------------------------ calcul stock */

export type StatutStock = "ok" | "bas" | "rupture";

/** Statut visuel d'un produit selon son stock et son seuil. */
export function statutStock(quantite: number, seuil: number): StatutStock {
  if (quantite === 0) return "rupture";
  if (quantite <= seuil) return "bas";
  return "ok";
}

/* --------------------------------------------------------------- mouvements */

export type TypeMouvement = "entree" | "sortie" | "ajustement";

export type Mouvement = {
  id: string;
  date_mouvement: string;
  produit_id: string;
  type: TypeMouvement;
  quantite: number;
  client_id: string | null;
  fournisseur: string | null;
  note: string | null;
  /** Renseigné si ce mouvement a été annulé : id de l'annulation. */
  annule_par: string | null;
  /** Renseigné si ce mouvement EST une annulation : id du mouvement annulé. */
  annulation_de: string | null;
  created_at: string;
};

export type MouvementAvecDetails = Mouvement & {
  produit_reference: string;
  produit_nom: string;
  client_nom: string | null;
};

/** Présentation d'un mouvement : libellé, symbole, ton, effet signé sur le stock. */
export type Nature = {
  libelle: string;
  symbole: string;
  ton: "jade" | "amber" | "neutre";
  /** Variation du stock (+ entrée, − sortie). */
  delta: number;
};

export function natureMouvement(m: Pick<Mouvement, "type" | "quantite" | "annulation_de">): Nature {
  if (m.annulation_de) {
    return { libelle: "Annulation", symbole: "↺", ton: "neutre", delta: m.quantite };
  }
  if (m.type === "entree") {
    return { libelle: "Entrée", symbole: "↑", ton: "jade", delta: m.quantite };
  }
  if (m.type === "sortie") {
    return { libelle: "Sortie", symbole: "↓", ton: "amber", delta: -m.quantite };
  }
  return { libelle: "Ajustement", symbole: "⚙", ton: "neutre", delta: m.quantite };
}

/** « +3 », « −2 » (vrai signe moins). */
export function formaterDelta(delta: number): string {
  return `${delta >= 0 ? "+" : "−"}${Math.abs(delta)}`;
}

/* ------------------------------------------------------------------ clients */

/** Table `clients` de masc-fiche (base partagée) : lecture seule ici. */
export type Client = {
  id: string;
  nom: string;
  contact: string | null;
  telephone: string | null;
  email: string | null;
  adresse: string | null;
  created_at: string;
  updated_at: string;
};

/** Livraisons reçues par un client sur une période. */
export type ResumeLivraisons = {
  nb_livraisons: number;
  unites: number;
  nb_produits: number;
  derniere_livraison: string | null;
};

export type ClientAvecResume = Client & ResumeLivraisons;

/** Une ligne de la fiche client : un consommable livré. */
export type LigneFicheClient = {
  produit_id: string;
  reference: string;
  nom: string;
  categorie_nom: string | null;
  unites: number;
  nb_livraisons: number;
  premiere_livraison: string;
  derniere_livraison: string;
};