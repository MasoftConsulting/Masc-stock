import Link from "next/link";
import { Reveler } from "@/components/reveler";
import { EnTetePage } from "@/components/ui";
import { listerProduitsComplet } from "@/lib/produits";
import { GestionInventaire } from "./gestion-inventaire";

export const dynamic = "force-dynamic";

export default async function PageInventaire() {
  const produits = await listerProduitsComplet();
  const actifs = produits.filter((p) => p.actif);

  return (
    <>
      <Reveler>
        <EnTetePage
          rubrique="Inventaire physique"
          titre="Inventaire"
          avant={
            <Link
              href="/mouvements"
              className="inline-flex items-center gap-2 text-[0.9rem] text-ink-soft transition-colors duration-500 ease-mass hover:text-ink"
            >
              <span aria-hidden="true">←</span> Mouvements
            </Link>
          }
        >
          Saisissez les quantités réellement comptées. Un ajustement sera créé
          pour chaque écart avec le stock au moment de la validation.
        </EnTetePage>
      </Reveler>

      <Reveler delai={90}>
        <div className="mt-10">
          <GestionInventaire produits={actifs} />
        </div>
      </Reveler>
    </>
  );
}
