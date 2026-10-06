import { Reveler } from "@/components/reveler";
import { Bandeau, EnTetePage } from "@/components/ui";
import { listerProduitsComplet } from "@/lib/produits";
import { listerCategories } from "@/lib/categories";
import { GestionProduits } from "./gestion-produits";

export const dynamic = "force-dynamic";

export default async function PageProduits({ searchParams }: PageProps<"/produits">) {
  const sp = await searchParams;
  const erreur = typeof sp.erreur === "string" ? sp.erreur : undefined;

  const [produits, categories] = await Promise.all([listerProduitsComplet(), listerCategories()]);

  return (
    <>
      <Reveler>
        <EnTetePage rubrique="Référentiel" titre="Produits">
          Toutes les références consommables que vous stockez. Le stock affiché
          est calculé à partir des mouvements.
        </EnTetePage>
      </Reveler>

      {sp.supprime && <Bandeau ton="succes">Produit supprimé.</Bandeau>}
      {erreur && <Bandeau ton="erreur">{erreur}</Bandeau>}

      <Reveler delai={90}>
        <div className="mt-10">
          <GestionProduits produits={produits} categories={categories} />
        </div>
      </Reveler>
    </>
  );
}
