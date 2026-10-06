import { Reveler } from "@/components/reveler";
import { Bandeau, EnTetePage } from "@/components/ui";
import { listerCategoriesAvecStats } from "@/lib/categories";
import { GestionCategories } from "./gestion-categories";

export const dynamic = "force-dynamic";

export default async function PageCategories({ searchParams }: PageProps<"/categories">) {
  const sp = await searchParams;
  const erreur = typeof sp.erreur === "string" ? sp.erreur : undefined;
  const categories = await listerCategoriesAvecStats();

  return (
    <>
      <Reveler>
        <EnTetePage rubrique="Référentiel" titre="Catégories">
          Regroupez vos produits par type : toners, tambours, développeurs…
        </EnTetePage>
      </Reveler>

      {sp.supprime && <Bandeau ton="succes">Catégorie supprimée.</Bandeau>}
      {erreur && <Bandeau ton="erreur">{erreur}</Bandeau>}

      <Reveler delai={90}>
        <div className="mt-10">
          <GestionCategories categories={categories} />
        </div>
      </Reveler>
    </>
  );
}
