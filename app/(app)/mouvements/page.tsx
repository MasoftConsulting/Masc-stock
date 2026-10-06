import { Reveler } from "@/components/reveler";
import { Bandeau, EnTetePage } from "@/components/ui";
import { listerMouvements } from "@/lib/mouvements";
import { listerProduitsComplet } from "@/lib/produits";
import { listerClients } from "@/lib/clients";
import { GestionMouvements } from "./gestion-mouvements";

export const dynamic = "force-dynamic";

export default async function PageMouvements({ searchParams }: PageProps<"/mouvements">) {
  const sp = await searchParams;
  const texte = (cle: string) => (typeof sp[cle] === "string" ? (sp[cle] as string) : undefined);

  const [mouvements, produits, clients] = await Promise.all([
    listerMouvements({ limite: 200 }),
    listerProduitsComplet(),
    listerClients(),
  ]);

  // Actions rapides : /mouvements?nouveau=sortie&produit=<id>
  const nouveau = texte("nouveau");
  const initial =
    nouveau === "entree" || nouveau === "sortie"
      ? { type: nouveau as "entree" | "sortie", produitId: texte("produit") }
      : undefined;

  const inventaire = Number(texte("inventaire"));
  const erreur = texte("erreur");

  return (
    <>
      <Reveler>
        <EnTetePage rubrique="Journal" titre="Mouvements">
          Entrées, sorties et ajustements. Le stock de chaque produit est
          calculé à partir de ces mouvements ; une erreur se corrige en
          annulant le mouvement.
        </EnTetePage>
      </Reveler>

      {inventaire > 0 && (
        <Bandeau ton="succes">
          Inventaire validé : {inventaire} ajustement{inventaire > 1 ? "s" : ""} créé
          {inventaire > 1 ? "s" : ""}.
        </Bandeau>
      )}
      {erreur && <Bandeau ton="erreur">{erreur}</Bandeau>}

      <Reveler delai={90}>
        <div className="mt-10">
          <GestionMouvements
            key={nouveau ? `${nouveau}-${texte("produit")}` : "journal"}
            mouvements={mouvements}
            produits={produits}
            clients={clients}
            initial={initial}
          />
        </div>
      </Reveler>
    </>
  );
}
