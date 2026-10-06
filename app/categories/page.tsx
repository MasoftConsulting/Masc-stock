import { Coquille } from "@/components/coquille";
import { Reveler } from "@/components/reveler";
import { listerCategoriesAvecStats } from "@/lib/categories";
import { GestionCategories } from "./gestion-categories";

export const dynamic = "force-dynamic";

export default async function PageCategories({
  searchParams,
}: {
  searchParams: Promise<{ supprime?: string; erreur?: string }>;
}) {
  const sp = await searchParams;
  const categories = await listerCategoriesAvecStats();

  return (
    <Coquille>
      <Reveler>
        <header className="pt-8 md:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Référentiel
          </span>
          <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
            Catégories
          </h1>
          <p className="mt-4 max-w-lg text-[0.9rem] leading-relaxed text-ink-soft">
            Regroupez vos produits par type : toners, tambours, fours, etc.
            Chaque produit appartient à une catégorie.
          </p>
        </header>
      </Reveler>

      {sp.supprime && (
        <Reveler delai={40}>
          <p className="mt-8 rounded-2xl bg-jade/10 px-5 py-3.5 text-[0.85rem] text-jade">
            Catégorie supprimée.
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
          <GestionCategories categories={categories} />
        </div>
      </Reveler>
    </Coquille>
  );
}