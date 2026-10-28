import ExcelJS from "exceljs";
import { formaterDate } from "../format";
import type { FicheClient } from "../clients";

/**
 * Fiche client au format Excel (.xlsx), en deux feuilles :
 * « Synthèse » (en-tête + consommables livrés) et « Livraisons » (détail).
 *
 * Les quantités sont de vrais nombres et les dates de vraies dates Excel :
 * le classeur se trie, se filtre et se calcule sans conversion. Les textes
 * sont écrits comme chaînes, jamais comme formules : pas d'injection possible.
 */

const FORMAT_DATE = "dd/mm/yyyy";
const GRIS = { type: "pattern", pattern: "solid", fgColor: { argb: "FFEDEBE6" } } as const;

/**
 * Date Excel du jour calendaire affiché par `formaterDate` (heure locale),
 * ancrée à minuit UTC pour qu'Excel ne décale pas d'un jour.
 */
function dateExcel(valeur: string | null | undefined): Date | null {
  if (!valeur) return null;
  const d = new Date(valeur);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
}

/** En-tête de tableau : gras, fond gris, bordure basse. */
function styliserEntete(ligne: ExcelJS.Row) {
  ligne.font = { bold: true };
  ligne.eachCell((cellule) => {
    cellule.fill = GRIS;
    cellule.border = { bottom: { style: "thin" } };
  });
}

export async function ficheClientXlsx(fiche: FicheClient, genereLe: Date): Promise<ArrayBuffer> {
  const { client, periode, lignes, livraisons, totaux } = fiche;

  const classeur = new ExcelJS.Workbook();
  classeur.creator = "MA SOFT CONSULTING";
  classeur.created = genereLe;

  // ── Synthèse ─────────────────────────────────────────────────────────────
  const synthese = classeur.addWorksheet("Synthèse");
  synthese.columns = [
    { width: 16 },
    { width: 36 },
    { width: 22 },
    { width: 15, style: { numFmt: "#,##0" } },
    { width: 12, style: { numFmt: "#,##0" } },
    { width: 18, style: { numFmt: FORMAT_DATE } },
    { width: 18, style: { numFmt: FORMAT_DATE } },
  ];

  synthese.addRow(["Fiche d'inventaire client", "MA SOFT CONSULTING"]).font = { bold: true, size: 14 };
  for (const [libelle, valeur] of [
    ["Client", client.nom],
    ["Contact", client.contact],
    ["Téléphone", client.telephone],
    ["Période", periode.libelle],
    ["Générée le", formaterDate(genereLe.toISOString())],
  ] as const) {
    synthese.addRow([libelle, valeur ?? ""]).getCell(1).font = { bold: true };
  }
  synthese.addRow([]);

  synthese.addRow(["CONSOMMABLES LIVRÉS"]).font = { bold: true };
  styliserEntete(
    synthese.addRow([
      "Référence",
      "Produit",
      "Catégorie",
      "Unités livrées",
      "Livraisons",
      "Première livraison",
      "Dernière livraison",
    ]),
  );
  for (const l of lignes) {
    synthese.addRow([
      l.reference,
      l.nom,
      l.categorie_nom ?? "",
      l.unites,
      l.nb_livraisons,
      dateExcel(l.premiere_livraison),
      dateExcel(l.derniere_livraison),
    ]);
  }
  const total = synthese.addRow(["Total", "", "", totaux.unites, totaux.nb_livraisons]);
  total.font = { bold: true };
  total.eachCell((cellule) => (cellule.border = { top: { style: "thin" } }));

  // ── Livraisons ───────────────────────────────────────────────────────────
  const detail = classeur.addWorksheet("Livraisons");
  detail.columns = [
    { width: 14, style: { numFmt: FORMAT_DATE } },
    { width: 16 },
    { width: 36 },
    { width: 12, style: { numFmt: "#,##0" } },
    { width: 40 },
  ];

  if (fiche.livraisonsTronquees) {
    detail.addRow([`Détail limité aux ${livraisons.length} livraisons les plus récentes.`]).font = {
      italic: true,
    };
  }
  const entete = detail.addRow(["Date", "Référence", "Produit", "Quantité", "Note"]);
  styliserEntete(entete);
  for (const m of livraisons) {
    detail.addRow([dateExcel(m.date_mouvement), m.produit_reference, m.produit_nom, m.quantite, m.note ?? ""]);
  }
  detail.views = [{ state: "frozen", ySplit: entete.number }];
  detail.autoFilter = {
    from: { row: entete.number, column: 1 },
    to: { row: entete.number, column: 5 },
  };

  return classeur.xlsx.writeBuffer();
}
