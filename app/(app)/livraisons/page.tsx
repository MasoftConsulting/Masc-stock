import Link from "next/link";
import { Reveler } from "@/components/reveler";
import { listerBonsLivraison } from "@/lib/bons-livraison";
import { formaterDate } from "@/lib/format";
import { BoutonSupprimerBL } from "./bouton-supprimer";

export const dynamic = "force-dynamic";

export default async function PageLivraisons({
  searchParams,
}: {
  searchParams: Promise<{ supprime?: string }>;
}) {
  const bls = await listerBonsLivraison();
  const sp = await searchParams;

  return (
    <>
      <Reveler>
        <header className="flex flex-col gap-4 pt-8 md:flex-row md:items-end md:justify-between md:pt-14">
          <div>
            <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
              <span className="h-1.5 w-1.5 rounded-full bg-brand" />
              Logistique
            </span>
            <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
              Bons de<br />
              <span className="text-ink-faint">livraison</span>
            </h1>
          </div>
          <Link
            href="/livraisons/nouveau"
            className="group flex items-center justify-between gap-3 rounded-full bg-ink px-6 py-3 text-[0.95rem] font-medium text-white shadow-flottant transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
          >
            <span>Nouveau BL</span>
            <span className="grid h-8 w-8 place-items-center rounded-full bg-white/12 transition-all duration-500 ease-mass group-hover:translate-x-1">
              +
            </span>
          </Link>
        </header>
      </Reveler>

      {/* Message de succès après suppression */}
      {sp.supprime && (
        <Reveler delai={40}>
          <div className="mt-8 rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
            Bon de livraison supprimé avec succès. Le stock a été mis à jour.
          </div>
        </Reveler>
      )}

      <Reveler delai={90}>
        <div className="mt-10 space-y-3">
          {bls.length === 0 ? (
            <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
              <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-16 text-center text-ink-soft">
                Aucun bon de livraison pour le moment.
              </div>
            </div>
          ) : (
            bls.map((bl) => (
              // La carte conteneur n'est PAS un lien global
              <div
                key={bl.id}
                className="rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60 transition-all duration-500 ease-mass hover:bg-white/80"
              >
                <div className="rounded-[calc(1.6rem-0.375rem)] bg-surface px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-6">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    
                    {/* Le contenu cliquable (titre, date) est dans un Link */}
                    <Link href={`/impression/bl/${bl.id}`} className="group block min-w-0 flex-1">
                      <span className="font-mono text-[0.85rem] text-brand">{bl.numero}</span>
                      <p className="mt-0.5 font-display text-[1.15rem] font-semibold group-hover:text-navy-deep transition-colors">
                        {bl.client_nom}
                      </p>
                    </Link>

                    {/* Les actions (date, suppression) sont à droite, hors du Link */}
                    <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[0.85rem] text-ink">{formaterDate(bl.date_livraison)}</p>
                        <p className="text-[0.75rem] text-ink-faint">Émis par {bl.emis_par}</p>
                    </div>
                    <Link 
                        href={`/livraisons/${bl.id}/modifier`}
                        className="rounded-full px-3 py-1.5 text-[0.8rem] text-ink-soft hover:bg-ink/5"
                    >
                        Modifier
                    </Link>
                    <BoutonSupprimerBL id={bl.id} />
                    </div>
                    
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Reveler>
    </>
  );
}