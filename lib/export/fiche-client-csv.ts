import { formaterDate } from "../format";
import type { FicheClient } from "../clients";

/**
 * Fiche client au format CSV, réglé pour Excel en français :
 * séparateur `;`, fins de ligne CRLF, BOM UTF-8 (sinon Excel casse les
 * accents).
 */

/**
 * Échappe une cellule. Une valeur commençant par = + - @ serait interprétée
 * comme une formule par Excel (injection CSV) : on la préfixe d'une apostrophe.
 * Exception : un numéro de téléphone (« +228 90 00 00 00 ») reste intact.
 */
function cellule(valeur: string | number | null | undefined): string {
  if (valeur === null || valeur === undefined) return "";
  if (typeof valeur === "number") return String(valeur);

  const formule = /^[=+\-@\t\r]/.test(valeur) && !/^[+-][\d\s().]+$/.test(valeur);
  const texte = formule ? `'${valeur}` : valeur;
  return /[";\r\n]/.test(texte) ? `"${texte.replace(/"/g, '""')}"` : texte;
}

function ligne(...valeurs: (string | number | null | undefined)[]): string {
  return valeurs.map(cellule).join(";");
}

export function ficheClientCsv(fiche: FicheClient, genereLe: Date): string {
  const { client, periode, lignes, livraisons, totaux } = fiche;

  const contenu = [
    ligne("Fiche d'inventaire client", "MA SOFT CONSULTING"),
    ligne("Client", client.nom),
    ligne("Contact", client.contact),
    ligne("Téléphone", client.telephone),
    ligne("Période", periode.libelle),
    ligne("Générée le", formaterDate(genereLe.toISOString())),
    "",
    ligne("CONSOMMABLES LIVRÉS"),
    ligne("Référence", "Produit", "Catégorie", "Unités livrées", "Livraisons", "Première livraison", "Dernière livraison"),
    ...lignes.map((l) =>
      ligne(
        l.reference,
        l.nom,
        l.categorie_nom,
        l.unites,
        l.nb_livraisons,
        formaterDate(l.premiere_livraison),
        formaterDate(l.derniere_livraison),
      ),
    ),
    ligne("Total", "", "", totaux.unites, totaux.nb_livraisons),
    "",
    ligne(
      fiche.livraisonsTronquees
        ? `DÉTAIL DES LIVRAISONS (${livraisons.length} plus récentes)`
        : "DÉTAIL DES LIVRAISONS",
    ),
    ligne("Date", "Référence", "Produit", "Quantité", "Note"),
    ...livraisons.map((m) =>
      ligne(formaterDate(m.date_mouvement), m.produit_reference, m.produit_nom, m.quantite, m.note),
    ),
  ];

  return "﻿" + contenu.join("\r\n") + "\r\n";
}
