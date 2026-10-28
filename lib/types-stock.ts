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

/* --------------------------------------------------------------- équipements */

export type Equipement = {
  id: string;
  client_id: string;
  marque_modele: string | null;
  numero_serie: string | null;
  localisation: string | null;
};

/* --------------------------------------------------------------- livraisons */

export type BonLivraisonLigne = {
  id: string;
  bl_id: string;
  produit_id: string;
  quantite: number;
};

export type BonLivraison = {
  id: string;
  numero: string;
  date_livraison: string;
  client_id: string;
  contact_noms: string | null;
  contact_details: string | null;
  numero_commande: string | null;
  emis_par: string;
  signature_client: string | null;
  statut: string;
  created_at: string;
  updated_at: string;
};

export type BonLivraisonAvecDetails = BonLivraison & {
  client_nom: string;
  client_adresse: string | null;
  client_equipements: Equipement[];
  lignes: (BonLivraisonLigne & {
    produit_reference: string;
    produit_nom: string;
    produit_type: string | null;
    produit_compatibilite: string | null;
  })[];
};

export type Contact = {
  id: string;
  client_id: string;
  nom: string;
  poste: string | null;
  email: string | null;
  telephone: string | null;
  created_at: string;
  updated_at: string;
};

/* ----------------------------------------------------------------- journal */

/**
 * Format : `domaine.verbe` (ex. `bl.creation`, `produit.modification`).
 * Compatible avec la table `journal` existante (partagée entre apps MASC).
 */
export type ActionJournal =
  | "bl.creation" | "bl.modification" | "bl.suppression"
  | "produit.creation" | "produit.modification" | "produit.bascule" | "produit.suppression"
  | "categorie.creation" | "categorie.modification" | "categorie.bascule" | "categorie.suppression"
  | "mouvement.entree" | "mouvement.sortie" | "mouvement.inventaire" | "mouvement.annulation";

export type EntreeJournal = {
  id: string;
  created_at: string;
  action: string;                       // text libre côté DB (on caste en ActionJournal à la lecture)
  table_cible: string | null;
  ligne_id: string | null;
  acteur_id: string | null;
  acteur_nom: string | null;
  details: Record<string, unknown> | null;
};

/** Libellé français + ton visuel pour chaque action. */
export function libelleAction(action: string): {
  libelle: string;
  ton: "jade" | "amber" | "rouille" | "neutre";
} {
  switch (action) {
    case "bl.creation":              return { libelle: "Création d'un bon de livraison", ton: "jade" };
    case "bl.modification":          return { libelle: "Modification d'un bon de livraison", ton: "amber" };
    case "bl.suppression":           return { libelle: "Suppression d'un bon de livraison", ton: "rouille" };
    case "produit.creation":         return { libelle: "Création d'un produit", ton: "jade" };
    case "produit.modification":     return { libelle: "Modification d'un produit", ton: "amber" };
    case "produit.bascule":          return { libelle: "Changement de statut d'un produit", ton: "neutre" };
    case "produit.suppression":      return { libelle: "Suppression d'un produit", ton: "rouille" };
    case "categorie.creation":       return { libelle: "Création d'une catégorie", ton: "jade" };
    case "categorie.modification":   return { libelle: "Modification d'une catégorie", ton: "amber" };
    case "categorie.bascule":        return { libelle: "Changement de statut d'une catégorie", ton: "neutre" };
    case "categorie.suppression":    return { libelle: "Suppression d'une catégorie", ton: "rouille" };
    case "mouvement.entree":         return { libelle: "Entrée de stock", ton: "jade" };
    case "mouvement.sortie":         return { libelle: "Sortie de stock", ton: "amber" };
    case "mouvement.inventaire":     return { libelle: "Inventaire validé", ton: "neutre" };
    case "mouvement.annulation":     return { libelle: "Annulation de mouvement", ton: "rouille" };
    default:                         return { libelle: action, ton: "neutre" };
  }
}

/** Libellé humain pour une `table_cible`. */
export function libelleTableCible(table: string | null): string {
  switch (table) {
    case "bons_livraison": return "Bon de livraison";
    case "produits":       return "Produit";
    case "categories":     return "Catégorie";
    case "mouvements":     return "Mouvement";
    default:               return table ?? "—";
  }
}