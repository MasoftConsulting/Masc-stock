import Link from "next/link";
import { Coquille } from "@/components/coquille";
import { Reveler } from "@/components/reveler";
import { Carte, EnTetePage, Indicateur, TitreSection, Vide } from "@/components/ui";
import { lireTableauDeBord } from "@/lib/tableau-de-bord";
import { formaterDate, formaterNombre } from "@/lib/format";
import { statutStock, symboleMouvement } from "@/lib/types-stock";

export const dynamic = "force-dynamic";

const LIEN_DISCRET =
  "rounded-full px-3 py-1.5 text-[0.75rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink";

export default async function PageTableauDeBord() {
  const tdb = await lireTableauDeBord();
  const { produits, activite } = tdb;

  return (
    <Coquille>
      <Reveler>
        <EnTetePage
          rubrique="Tableau de bord"
          titre={
            <>
              Stock
              <br />
              <span className="text-ink-faint">MA SOFT</span>
            </>
          }
        >
          {produits.rupture + produits.bas === 0
            ? "Aucun produit sous son seuil d'alerte."
            : `${produits.rupture} produit${produits.rupture > 1 ? "s" : ""} en rupture, ${produits.bas} sous le seuil d'alerte.`}
        </EnTetePage>
      </Reveler>

      <Reveler delai={60}>
        <div className="mt-10 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicateur
            libelle="Références actives"
            valeur={formaterNombre(produits.actifs)}
            detail={`${formaterNombre(produits.unites)} unités en stock`}
          />
          <Indicateur
            libelle="En rupture"
            valeur={formaterNombre(produits.rupture)}
            ton={produits.rupture > 0 ? "rouille" : "neutre"}
          />
          <Indicateur
            libelle="Sous le seuil"
            valeur={formaterNombre(produits.bas)}
            ton={produits.bas > 0 ? "amber" : "neutre"}
          />
          <Indicateur
            libelle="Sorties ce mois-ci"
            valeur={formaterNombre(activite.sortie.unites)}
            detail={`${formaterNombre(activite.sortie.nb_mouvements)} livraison${activite.sortie.nb_mouvements > 1 ? "s" : ""} · ${formaterNombre(activite.entree.unites)} unités reçues`}
          />
        </div>
      </Reveler>

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <Reveler delai={120}>
          <Carte>
            <TitreSection
              titre="À réapprovisionner"
              detail="Produits actifs en rupture ou sous leur seuil d'alerte."
              action={
                <Link href="/produits" className={LIEN_DISCRET}>
                  Tous les produits
                </Link>
              }
            />
            {tdb.alertes.length === 0 ? (
              <Vide>Tout le stock est au-dessus des seuils.</Vide>
            ) : (
              <ul className="divide-y divide-hairline">
                {tdb.alertes.map((p) => {
                  const rupture = statutStock(p.quantite, p.seuil_alerte) === "rupture";
                  return (
                    <li key={p.id} className="flex items-center gap-4 py-3">
                      <div className="min-w-0 flex-1">
                        <p className="font-mono text-[0.7rem] tracking-[0.06em] text-brand">
                          {p.reference}
                        </p>
                        <p className="truncate text-[0.88rem]">{p.nom}</p>
                      </div>
                      <div className="text-right">
                        <p
                          className={`font-display text-[1.3rem] leading-none font-semibold ${
                            rupture ? "text-rouille" : "text-amber"
                          }`}
                        >
                          {p.quantite}
                        </p>
                        <p className="mt-1 text-[0.66rem] text-ink-faint">
                          seuil {p.seuil_alerte}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </Carte>
        </Reveler>

        <Reveler delai={160}>
          <Carte>
            <TitreSection
              titre="Meilleurs clients"
              detail="Unités livrées ce mois-ci."
              action={
                <Link href="/clients?periode=mois" className={LIEN_DISCRET}>
                  Tous les clients
                </Link>
              }
            />
            {tdb.meilleursClients.length === 0 ? (
              <Vide>Aucune livraison ce mois-ci.</Vide>
            ) : (
              <ol className="divide-y divide-hairline">
                {tdb.meilleursClients.map((c, i) => (
                  <li key={c.id}>
                    <Link
                      href={`/clients/${c.id}?periode=mois`}
                      className="flex items-center gap-3 py-3 transition-colors duration-500 ease-mass hover:text-navy"
                    >
                      <span className="w-4 font-mono text-[0.7rem] text-ink-faint">
                        {i + 1}
                      </span>
                      <span className="min-w-0 flex-1 truncate text-[0.88rem]">{c.nom}</span>
                      <span className="font-display text-[1.05rem] font-semibold">
                        {formaterNombre(c.unites)}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
            )}
          </Carte>
        </Reveler>
      </div>

      <Reveler delai={200}>
        <Carte className="mt-6">
          <TitreSection
            titre="Derniers mouvements"
            action={
              <Link href="/mouvements" className={LIEN_DISCRET}>
                Journal complet
              </Link>
            }
          />
          {tdb.derniersMouvements.length === 0 ? (
            <Vide>Aucun mouvement enregistré.</Vide>
          ) : (
            <ul className="divide-y divide-hairline">
              {tdb.derniersMouvements.map((m) => (
                <li key={m.id} className="flex items-center gap-4 py-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.9rem] ${
                      m.type === "entree"
                        ? "bg-jade/10 text-jade"
                        : m.type === "sortie"
                          ? "bg-amber/10 text-amber"
                          : "bg-ink/6 text-ink-soft"
                    }`}
                  >
                    {symboleMouvement(m.type)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.88rem]">
                      <span className="font-mono text-[0.7rem] text-brand">
                        {m.produit_reference}
                      </span>{" "}
                      {m.produit_nom}
                    </p>
                    <p className="text-[0.72rem] text-ink-faint">
                      {formaterDate(m.date_mouvement)}
                      {m.client_nom && ` · ${m.client_nom}`}
                      {m.fournisseur && ` · ${m.fournisseur}`}
                    </p>
                  </div>
                  <span className="font-display text-[1.05rem] font-semibold">
                    {m.type === "entree" ? "+" : m.type === "sortie" ? "−" : m.quantite > 0 ? "+" : "−"}
                    {Math.abs(m.quantite)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </Carte>
      </Reveler>
    </Coquille>
  );
}
