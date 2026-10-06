import "server-only";
import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  Document,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
  renderToBuffer,
} from "@react-pdf/renderer";
import { formaterDate } from "../format";
import type { FicheClient } from "../clients";

/**
 * Fiche client en PDF (A4), générée côté serveur.
 *
 * Page 1 : la fiche à faire signer (synthèse par produit).
 * Annexe : le détail des livraisons, en-tête de tableau répété à chaque page.
 *
 * Police Helvetica intégrée au PDF : elle couvre les accents français mais
 * pas l'espace fine insécable (U+202F) que `toLocaleString("fr-FR")` met
 * entre les milliers — d'où `nombre()` ci-dessous.
 */

const COULEURS = {
  encre: "#1a1a1a",
  doux: "#4a4a4a",
  pale: "#8a8a8a",
  filet: "#e8e6e2",
  navy: "#1e3a5f",
  brand: "#4a90e2",
};

const s = StyleSheet.create({
  page: {
    paddingTop: 36,
    paddingBottom: 56,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: COULEURS.encre,
  },
  entete: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    paddingBottom: 14,
    marginBottom: 4,
    borderBottomWidth: 2,
    borderBottomColor: COULEURS.navy,
  },
  logo: { height: 34, objectFit: "contain" },
  surtitre: { fontSize: 7, letterSpacing: 1.5, color: COULEURS.pale, textAlign: "right" },
  titre: { fontSize: 16, fontFamily: "Helvetica-Bold", color: COULEURS.navy, marginTop: 3, textAlign: "right" },
  blocClient: { flexDirection: "row", marginTop: 14, gap: 16 },
  colonne: { flex: 1 },
  etiquette: { fontSize: 6.5, letterSpacing: 1, color: COULEURS.pale, marginBottom: 3 },
  nomClient: { fontSize: 13, fontFamily: "Helvetica-Bold" },
  texteDoux: { color: COULEURS.doux, marginTop: 2 },
  indicateurs: { flexDirection: "row", marginTop: 16, gap: 8 },
  indicateur: { flex: 1, padding: 8, borderWidth: 1, borderColor: COULEURS.filet, borderRadius: 4 },
  valeur: { fontSize: 14, fontFamily: "Helvetica-Bold", marginTop: 2 },
  section: { fontSize: 10, fontFamily: "Helvetica-Bold", color: COULEURS.navy, marginTop: 16, marginBottom: 6 },
  ligneEntete: {
    flexDirection: "row",
    backgroundColor: COULEURS.navy,
    color: "#ffffff",
    paddingVertical: 5,
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
  },
  ligne: {
    flexDirection: "row",
    paddingVertical: 4.5,
    borderBottomWidth: 0.5,
    borderBottomColor: COULEURS.filet,
  },
  ligneTotal: {
    flexDirection: "row",
    paddingVertical: 5,
    borderTopWidth: 1.5,
    borderTopColor: COULEURS.encre,
    fontFamily: "Helvetica-Bold",
  },
  cellule: { paddingHorizontal: 4 },
  droite: { textAlign: "right" },
  reference: { fontFamily: "Courier", fontSize: 8, color: COULEURS.brand },
  note: { fontSize: 7, color: COULEURS.pale, marginTop: 1 },
  vide: { color: COULEURS.pale, paddingVertical: 10, textAlign: "center" },
  signatures: { flexDirection: "row", gap: 16, marginTop: 28 },
  signature: { flex: 1, height: 70, borderWidth: 1, borderColor: COULEURS.filet, borderRadius: 4, padding: 6 },
  pied: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7,
    color: COULEURS.pale,
  },
});

function nombre(valeur: number): string {
  return valeur.toLocaleString("fr-FR").replace(/[  ]/g, " ");
}

/** Largeurs des colonnes du tableau de synthèse. */
const COL = { ref: "17%", produit: "41%", unites: "12%", livraisons: "12%", derniere: "18%" };
/** Largeurs des colonnes du détail. */
const DET = { date: "15%", ref: "17%", produit: "56%", quantite: "12%" };

function EnTete({ logo, titre }: { logo: Buffer | null; titre: string }) {
  return (
    <View style={s.entete} fixed>
      {logo ? (
        // eslint-disable-next-line jsx-a11y/alt-text -- Image de react-pdf, pas une balise <img> : pas d'attribut alt.
        <Image src={{ data: logo, format: "png" }} style={s.logo} />
      ) : (
        <Text style={s.nomClient}>MA SOFT CONSULTING</Text>
      )}
      <View>
        <Text style={s.surtitre}>MASC STOCK</Text>
        <Text style={s.titre}>{titre}</Text>
      </View>
    </View>
  );
}

function Pied({ client, genereLe }: { client: string; genereLe: Date }) {
  return (
    <View style={s.pied} fixed>
      <Text>
        MA SOFT CONSULTING · {client} · Générée le {formaterDate(genereLe.toISOString())}
      </Text>
      <Text render={({ pageNumber, totalPages }) => `Page ${pageNumber} / ${totalPages}`} />
    </View>
  );
}

function FicheClientPdf({
  fiche,
  logo,
  genereLe,
}: {
  fiche: FicheClient;
  logo: Buffer | null;
  genereLe: Date;
}) {
  const { client, periode, lignes, livraisons, totaux } = fiche;
  const coordonnees = [client.contact, client.telephone, client.email].filter(Boolean);

  return (
    <Document
      title={`Fiche d'inventaire — ${client.nom}`}
      author="MA SOFT CONSULTING"
      language="fr"
    >
      <Page size="A4" style={s.page}>
        <EnTete logo={logo} titre="Fiche d'inventaire client" />

        <View style={s.blocClient}>
          <View style={[s.colonne, { flex: 2 }]}>
            <Text style={s.etiquette}>CLIENT</Text>
            <Text style={s.nomClient}>{client.nom}</Text>
            {coordonnees.length > 0 && <Text style={s.texteDoux}>{coordonnees.join("  ·  ")}</Text>}
            {client.adresse && <Text style={s.texteDoux}>{client.adresse}</Text>}
          </View>
          <View style={s.colonne}>
            <Text style={s.etiquette}>PÉRIODE</Text>
            <Text>{periode.libelle}</Text>
            {periode.code !== "personnalisee" && periode.du && (
              <Text style={s.texteDoux}>
                du {formaterDate(periode.du)} au {formaterDate(periode.au)}
              </Text>
            )}
          </View>
        </View>

        <View style={s.indicateurs}>
          {[
            ["UNITÉS LIVRÉES", nombre(totaux.unites)],
            ["RÉFÉRENCES", nombre(totaux.nb_produits)],
            ["LIVRAISONS", nombre(totaux.nb_livraisons)],
            ["DERNIÈRE LIVRAISON", formaterDate(livraisons[0]?.date_mouvement)],
          ].map(([libelle, valeur]) => (
            <View key={libelle} style={s.indicateur}>
              <Text style={s.etiquette}>{libelle}</Text>
              <Text style={s.valeur}>{valeur}</Text>
            </View>
          ))}
        </View>

        <Text style={s.section}>Consommables livrés</Text>
        <View style={s.ligneEntete}>
          <Text style={[s.cellule, { width: COL.ref }]}>RÉFÉRENCE</Text>
          <Text style={[s.cellule, { width: COL.produit }]}>PRODUIT</Text>
          <Text style={[s.cellule, s.droite, { width: COL.unites }]}>UNITÉS</Text>
          <Text style={[s.cellule, s.droite, { width: COL.livraisons }]}>LIVRAISONS</Text>
          <Text style={[s.cellule, s.droite, { width: COL.derniere }]}>DERNIÈRE</Text>
        </View>
        {lignes.length === 0 ? (
          <Text style={s.vide}>Aucun consommable livré sur cette période.</Text>
        ) : (
          <>
            {lignes.map((l) => (
              <View key={l.produit_id} style={s.ligne} wrap={false}>
                <Text style={[s.cellule, s.reference, { width: COL.ref }]}>{l.reference}</Text>
                <View style={[s.cellule, { width: COL.produit }]}>
                  <Text>{l.nom}</Text>
                  {l.categorie_nom && <Text style={s.note}>{l.categorie_nom}</Text>}
                </View>
                <Text style={[s.cellule, s.droite, { width: COL.unites, fontFamily: "Helvetica-Bold" }]}>
                  {nombre(l.unites)}
                </Text>
                <Text style={[s.cellule, s.droite, { width: COL.livraisons }]}>{l.nb_livraisons}</Text>
                <Text style={[s.cellule, s.droite, { width: COL.derniere }]}>
                  {formaterDate(l.derniere_livraison)}
                </Text>
              </View>
            ))}
            <View style={s.ligneTotal} wrap={false}>
              <Text style={[s.cellule, { width: "58%" }]}>Total</Text>
              <Text style={[s.cellule, s.droite, { width: COL.unites }]}>{nombre(totaux.unites)}</Text>
              <Text style={[s.cellule, s.droite, { width: COL.livraisons }]}>{totaux.nb_livraisons}</Text>
              <Text style={{ width: COL.derniere }} />
            </View>
          </>
        )}

        {livraisons.length > 0 && (
          <Text style={[s.note, { marginTop: 8 }]}>
            Détail des {livraisons.length} livraison{livraisons.length > 1 ? "s" : ""} en annexe.
          </Text>
        )}

        <View style={s.signatures} wrap={false}>
          <View style={s.signature}>
            <Text style={s.etiquette}>POUR MA SOFT CONSULTING</Text>
          </View>
          <View style={s.signature}>
            <Text style={s.etiquette}>CACHET ET SIGNATURE DU CLIENT</Text>
          </View>
        </View>

        <Pied client={client.nom} genereLe={genereLe} />
      </Page>

      {livraisons.length > 0 && (
        <Page size="A4" style={s.page}>
          <EnTete logo={logo} titre="Annexe — détail des livraisons" />
          <Text style={s.section}>
            {client.nom} · {periode.libelle}
            {fiche.livraisonsTronquees ? ` (${livraisons.length} plus récentes)` : ""}
          </Text>
          <View style={s.ligneEntete} fixed>
            <Text style={[s.cellule, { width: DET.date }]}>DATE</Text>
            <Text style={[s.cellule, { width: DET.ref }]}>RÉFÉRENCE</Text>
            <Text style={[s.cellule, { width: DET.produit }]}>PRODUIT</Text>
            <Text style={[s.cellule, s.droite, { width: DET.quantite }]}>QTÉ</Text>
          </View>
          {livraisons.map((m) => (
            <View key={m.id} style={s.ligne} wrap={false}>
              <Text style={[s.cellule, { width: DET.date }]}>{formaterDate(m.date_mouvement)}</Text>
              <Text style={[s.cellule, s.reference, { width: DET.ref }]}>{m.produit_reference}</Text>
              <View style={[s.cellule, { width: DET.produit }]}>
                <Text>{m.produit_nom}</Text>
                {m.note && <Text style={s.note}>{m.note}</Text>}
              </View>
              <Text style={[s.cellule, s.droite, { width: DET.quantite }]}>{nombre(m.quantite)}</Text>
            </View>
          ))}
          <Pied client={client.nom} genereLe={genereLe} />
        </Page>
      )}
    </Document>
  );
}

async function lireLogo(): Promise<Buffer | null> {
  try {
    return await readFile(path.join(process.cwd(), "public", "logo.png"));
  } catch {
    return null; // Le PDF reste utilisable sans logo.
  }
}

export async function ficheClientPdf(fiche: FicheClient, genereLe: Date): Promise<Buffer> {
  return renderToBuffer(
    <FicheClientPdf fiche={fiche} logo={await lireLogo()} genereLe={genereLe} />,
  );
}
