import { Coquille } from "@/components/coquille";
import { Reveler } from "@/components/reveler";
import { listerProduitsComplet } from "@/lib/produits";
import { listerCategories } from "@/lib/categories";
import { GestionProduits } from "./gestion-produits";

export const dynamic = "force-dynamic";

export default async function PageProduits({
  searchParams,
}: {
  searchParams: Promise<{ supprime?: string; erreur?: string }>;
}) {
  const sp = await searchParams;

  const [produits, categories] = await Promise.all([
    listerProduitsComplet(),
    listerCategories(),
  ]);

  return (
    <Coquille>
      <Reveler>
        <header className="pt-8 md:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Référentiel
          </span>
          <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
            Produits
          </h1>
          <p className="mt-4 max-w-lg text-[0.9rem] leading-relaxed text-ink-soft">
            Toutes les références consommables que vous stockez. Le stock
            affiché est calculé à partir des mouvements.
          </p>
        </header>
      </Reveler>

      {sp.supprime && (
        <Reveler delai={40}>
          <p className="mt-8 rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
            Produit supprimé.
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
          <GestionProduits produits={produits} categories={categories} />
        </div>
      </Reveler>
    </Coquille>
  );
}