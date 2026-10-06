import Link from "next/link";
import { notFound } from "next/navigation";
import { Reveler } from "@/components/reveler";
import { Carte, EnTetePage, Indicateur, TitreSection, Vide } from "@/components/ui";
import { SelecteurPeriode } from "@/components/selecteur-periode";
import { lireFicheClient } from "@/lib/clients";
import { lirePeriode, parametresPeriode } from "@/lib/periode";
import { formaterDate, formaterNombre } from "@/lib/format";

export const dynamic = "force-dynamic";

const BOUTON_TELECHARGER =
  "inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[0.82rem] font-medium transition-all duration-500 ease-mass active:scale-[0.97]";

function IconeTelechargement() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M8 2.5v8M4.5 7 8 10.5 11.5 7M3 13.5h10" />
    </svg>
  );
}

export default async function PageFicheClient({
  params,
  searchParams,
}: PageProps<"/clients/[id]">) {
  const { id } = await params;
  const periode = lirePeriode(await searchParams, "annee");
  const fiche = await lireFicheClient(id, periode);
  if (!fiche) notFound();

  const { client, lignes, livraisons, totaux } = fiche;
  const query = parametresPeriode(periode);
  const coordonnees = [client.contact, client.telephone, client.email, client.adresse].filter(
    Boolean,
  );

  return (
    <>
      <Reveler>
        <EnTetePage
          rubrique="Fiche d'inventaire client"
          titre={client.nom}
          avant={
            <Link
              href={`/clients?${query}`}
              className="inline-flex items-center gap-2 text-[0.8rem] text-ink-soft transition-colors duration-500 ease-mass hover:text-ink"
            >
              <svg
                width="13"
                height="13"
                viewBox="0 0 16 16"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M9.5 3.5 5 8l4.5 4.5" />
              </svg>
              Clients
            </Link>
          }
        >
          {coordonnees.length > 0 ? coordonnees.join(" · ") : "Aucune coordonnée renseignée."}
        </EnTetePage>
      </Reveler>

      <Reveler delai={60}>
        <div className="mt-10 flex flex-wrap items-end justify-between gap-4">
          <SelecteurPeriode chemin={`/clients/${id}`} periode={periode} />
          <div className="flex gap-2">
            <a
              href={`/clients/${id}/pdf?${query}`}
              className={`${BOUTON_TELECHARGER} bg-ink text-white hover:bg-navy-deep`}
            >
              <IconeTelechargement />
              PDF
            </a>
            <a
              href={`/clients/${id}/csv?${query}`}
              className={`${BOUTON_TELECHARGER} bg-ink/5 text-ink hover:bg-ink/10`}
            >
              <IconeTelechargement />
              Excel (CSV)
            </a>
          </div>
        </div>
      </Reveler>

      <Reveler delai={90}>
        <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <Indicateur libelle="Unités livrées" valeur={formaterNombre(totaux.unites)} />
          <Indicateur libelle="Références" valeur={formaterNombre(totaux.nb_produits)} />
          <Indicateur libelle="Livraisons" valeur={formaterNombre(totaux.nb_livraisons)} />
          <Indicateur
            libelle="Dernière livraison"
            valeur={
              <span className="text-[1.3rem]">
                {formaterDate(livraisons[0]?.date_mouvement)}
              </span>
            }
          />
        </div>
      </Reveler>

      <Reveler delai={120}>
        <Carte className="mt-6">
          <TitreSection
            titre="Consommables livrés"
            detail={`${periode.libelle} · un produit par ligne, du plus livré au moins livré.`}
          />
          {lignes.length === 0 ? (
            <Vide>Aucun consommable livré à ce client sur cette période.</Vide>
          ) : (
            <div className="-mx-2 overflow-x-auto">
              <table className="w-full min-w-[36rem] text-left text-[0.85rem]">
                <thead>
                  <tr className="text-[0.82rem] uppercase tracking-widest text-ink-faint">
                    <th className="px-2 pb-3 font-medium">Référence</th>
                    <th className="px-2 pb-3 font-medium">Produit</th>
                    <th className="px-2 pb-3 text-right font-medium">Unités</th>
                    <th className="px-2 pb-3 text-right font-medium">Livraisons</th>
                    <th className="px-2 pb-3 text-right font-medium">Dernière</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-hairline">
                  {lignes.map((l) => (
                    <tr key={l.produit_id}>
                      <td className="px-2 py-3 font-mono text-[0.8rem] text-brand">
                        {l.reference}
                      </td>
                      <td className="px-2 py-3">
                        {l.nom}
                        {l.categorie_nom && (
                          <span className="ml-2 text-[0.8rem] text-ink-faint">
                            {l.categorie_nom}
                          </span>
                        )}
                      </td>
                      <td className="px-2 py-3 text-right font-display text-[1rem] font-semibold">
                        {formaterNombre(l.unites)}
                      </td>
                      <td className="px-2 py-3 text-right text-ink-soft">{l.nb_livraisons}</td>
                      <td className="px-2 py-3 text-right text-ink-soft">
                        {formaterDate(l.derniere_livraison)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-ink/10 font-semibold">
                    <td className="px-2 pt-3" colSpan={2}>
                      Total
                    </td>
                    <td className="px-2 pt-3 text-right font-display text-[1rem]">
                      {formaterNombre(totaux.unites)}
                    </td>
                    <td className="px-2 pt-3 text-right">{totaux.nb_livraisons}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </Carte>
      </Reveler>

      {livraisons.length > 0 && (
        <Reveler delai={150}>
          <Carte className="mt-6">
            <TitreSection
              titre="Détail des livraisons"
              detail={
                fiche.livraisonsTronquees
                  ? `Les ${livraisons.length} plus récentes — réduisez la période pour tout voir.`
                  : `${livraisons.length} livraison${livraisons.length > 1 ? "s" : ""}, la plus récente en tête.`
              }
            />
            <ul className="divide-y divide-hairline">
              {livraisons.map((m) => (
                <li key={m.id} className="flex items-center gap-4 py-3">
                  <span className="w-24 shrink-0 text-[0.8rem] text-ink-soft">
                    {formaterDate(m.date_mouvement)}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[0.85rem]">
                      <span className="font-mono text-[0.8rem] text-brand">
                        {m.produit_reference}
                      </span>{" "}
                      {m.produit_nom}
                    </p>
                    {m.note && <p className="truncate text-[0.8rem] text-ink-faint">{m.note}</p>}
                  </div>
                  <span className="font-display text-[1.05rem] font-semibold">
                    {formaterNombre(m.quantite)}
                  </span>
                </li>
              ))}
            </ul>
          </Carte>
        </Reveler>
      )}
    </>
  );
}
