import Link from "next/link";
import { Coquille } from "@/components/coquille";
import { Reveler } from "@/components/reveler";
import { listerProduitsComplet } from "@/lib/produits";
import { GestionInventaire } from "./gestion-inventaire";

export const dynamic = "force-dynamic";

export default async function PageInventaire() {
  const produits = await listerProduitsComplet();
  const actifs = produits.filter((p) => p.actif);

  return (
    <Coquille>
      <Reveler>
        <header className="pt-8 md:pt-14">
          <Link
            href="/mouvements"
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
            Mouvements
          </Link>

          <span className="mt-6 inline-flex items-center gap-2 rounded-full bg-ink/[0.05] px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft">
            <span className="h-1.5 w-1.5 rounded-full bg-ink-soft" />
            Inventaire physique
          </span>
          <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
            Inventaire
          </h1>
          <p className="mt-4 max-w-lg text-[0.9rem] leading-relaxed text-ink-soft">
            Saisissez les quantités réellement comptées. Un ajustement sera
            créé pour chaque écart détecté.
          </p>
        </header>
      </Reveler>

      <Reveler delai={90}>
        <div className="mt-10">
          <GestionInventaire produits={actifs} />
        </div>
      </Reveler>
    </Coquille>
  );
}