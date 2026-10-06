import { Coquille } from "@/components/coquille";
import { Reveler } from "@/components/reveler";
import { listerMouvements } from "@/lib/mouvements";
import { listerProduitsComplet } from "@/lib/produits";
import { listerClients } from "@/lib/clients";
import { GestionMouvements } from "./gestion-mouvements";

export const dynamic = "force-dynamic";

export default async function PageMouvements({
  searchParams,
}: {
  searchParams: Promise<{
    supprime?: string;
    erreur?: string;
    inventaire?: string;
  }>;
}) {
  const sp = await searchParams;

  const [mouvements, produits, clients] = await Promise.all([
    listerMouvements({ limite: 200 }),
    listerProduitsComplet(),
    listerClients(),
  ]);

  return (
    <Coquille>
      <Reveler>
        <header className="pt-8 md:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Journal
          </span>
          <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
            Mouvements
          </h1>
          <p className="mt-4 max-w-lg text-[0.9rem] leading-relaxed text-ink-soft">
            Entrées, sorties et ajustements. Le stock de chaque produit est
            calculé à partir de ces mouvements.
          </p>
        </header>
      </Reveler>

      {sp.supprime && (
        <Reveler delai={40}>
          <p className="mt-8 rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
            Mouvement supprimé.
          </p>
        </Reveler>
      )}

      {sp.inventaire && (
        <Reveler delai={40}>
          <p className="mt-8 rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
            Inventaire validé. {sp.inventaire} ajustement
            {Number(sp.inventaire) > 1 ? "s" : ""} créé
            {Number(sp.inventaire) > 1 ? "s" : ""}.
          </p>
        </Reveler>
      )}

      {sp.erreur && (
        <Reveler delai={40}>
          <p className="mt-8 rounded-2xl bg-rouille/10 px-5 py-3.5 text-[0.85rem] text-rouille">
            {sp.erreur}
          </p>
        </Reveler>
      )}

      <Reveler delai={90}>
        <div className="mt-10">
          <GestionMouvements
            mouvements={mouvements}
            produits={produits}
            clients={clients}
            />
        </div>
      </Reveler>
    </Coquille>
  );
}