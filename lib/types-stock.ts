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
  created_at: string;
};

export type MouvementAvecDetails = Mouvement & {
  produit_reference: string;
  produit_nom: string;
  client_nom: string | null;
};

export const LABELS_TYPE: Record<TypeMouvement, string> = {
  entree: "Entrée",
  sortie: "Sortie",
  ajustement: "Ajustement",
};

/** Signe visuel d'un mouvement (↑ entrée, ↓ sortie, ⚙ ajustement). */
export function symboleMouvement(type: TypeMouvement): string {
  if (type === "entree") return "↑";
  if (type === "sortie") return "↓";
  return "⚙";
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