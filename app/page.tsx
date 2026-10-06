import { Coquille } from "@/components/coquille";
import { Reveler } from "@/components/reveler";

export const dynamic = "force-dynamic";

export default async function PageTableauDeBord() {
  return (
    <Coquille>
      <Reveler>
        <header className="pt-8 md:pt-14">
          <span className="inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-brand" />
            Tableau de bord
          </span>
          <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
            Stock
            <br />
            <span className="text-ink-faint">MA SOFT</span>
          </h1>
          <p className="mt-4 max-w-lg text-[0.9rem] leading-relaxed text-ink-soft">
            Bienvenue sur MASC Stock. Les fondations sont posées. Les écrans
            Produits, Catégories, Mouvements et Clients arrivent dans les
            prochaines étapes.
          </p>
        </header>
      </Reveler>
    </Coquille>
  );
}