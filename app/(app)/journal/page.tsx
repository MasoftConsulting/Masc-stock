import Link from "next/link";
import { Reveler } from "@/components/reveler";
import { Carte, EnTetePage, TitreSection, Vide } from "@/components/ui";
import { listerJournal } from "@/lib/journal";
import {
  libelleAction,
  libelleTableCible,
} from "@/lib/types-stock";
import { formaterDate } from "@/lib/format";

export const dynamic = "force-dynamic";

const PASTILLE = {
  jade: "bg-jade/10 text-jade",
  amber: "bg-amber/10 text-amber",
  rouille: "bg-rouille/10 text-rouille",
  neutre: "bg-ink/6 text-ink-soft",
};

const FILTRES: { valeur: string | null; libelle: string }[] = [
  { valeur: null,             libelle: "Tout" },
  { valeur: "bons_livraison", libelle: "Bons de livraison" },
  { valeur: "produits",       libelle: "Produits" },
  { valeur: "categories",     libelle: "Catégories" },
  { valeur: "mouvements",     libelle: "Mouvements" },
];

function formaterHeure(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

/** Extrait les infos utiles pour l'affichage compact. */
function resumeDetails(details: Record<string, unknown> | null): string | null {
  if (!details) return null;
  const morceaux: string[] = [];
  if (typeof details.numero === "string")     morceaux.push(details.numero);
  if (typeof details.reference === "string")  morceaux.push(details.reference);
  if (typeof details.nom === "string")        morceaux.push(details.nom);
  if (typeof details.quantite === "number")   morceaux.push(`×${details.quantite}`);
  if (typeof details.motif === "string")      morceaux.push(`« ${details.motif} »`);
  if (typeof details.nb_lignes === "number")  morceaux.push(`${details.nb_lignes} ligne${details.nb_lignes > 1 ? "s" : ""}`);
  if (typeof details.nb_ecarts === "number")  morceaux.push(`${details.nb_ecarts} écart${details.nb_ecarts > 1 ? "s" : ""}`);
  return morceaux.length ? morceaux.join(" · ") : null;
}

export default async function PageJournal({
  searchParams,
}: {
  searchParams: Promise<{ type?: string }>;
}) {
  const { type } = await searchParams;
  const filtre = FILTRES.some((f) => f.valeur === (type ?? null)) ? (type ?? null) : null;

  const entrees = await listerJournal({ limite: 200, tableCible: filtre });

  return (
    <>
      <Reveler>
        <EnTetePage
          rubrique="Journal"
          titre={
            <>
              Journal
              <br />
              <span className="text-ink-faint">d'activité</span>
            </>
          }
        >
          Historique des actions effectuées dans l'application.
        </EnTetePage>
      </Reveler>

      <Reveler delai={60}>
        <div className="mt-8 flex flex-wrap gap-2">
          {FILTRES.map((f) => {
            const actif = (f.valeur ?? null) === filtre;
            const href = f.valeur ? `/journal?type=${f.valeur}` : "/journal";
            return (
              <Link
                key={f.valeur ?? "tous"}
                href={href}
                className={`rounded-full px-4 py-2 text-[0.85rem] font-medium transition-all duration-500 ease-mass ${
                  actif
                    ? "bg-ink text-white"
                    : "bg-ink/5 text-ink-soft hover:bg-ink/10 hover:text-ink"
                }`}
              >
                {f.libelle}
              </Link>
            );
          })}
        </div>
      </Reveler>

      <Reveler delai={120}>
        <Carte className="mt-6">
          <TitreSection
            titre="Dernières actions"
            detail={`${entrees.length} entrée${entrees.length > 1 ? "s" : ""} affichée${entrees.length > 1 ? "s" : ""} (max. 200).`}
          />
          {entrees.length === 0 ? (
            <Vide>Aucune action enregistrée pour l'instant.</Vide>
          ) : (
            <ul className="divide-y divide-hairline">
              {entrees.map((e) => {
                const { libelle, ton } = libelleAction(e.action);
                const resume = resumeDetails(e.details);
                return (
                  <li key={e.id} className="flex items-start gap-4 py-3">
                    <span
                      aria-hidden="true"
                      className={`grid h-8 w-8 shrink-0 place-items-center rounded-full text-[0.7rem] font-semibold ${PASTILLE[ton]}`}
                    >
                      {ton === "jade" ? "+" : ton === "rouille" ? "✕" : ton === "amber" ? "✎" : "·"}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[0.9rem]">
                        {libelle}
                        <span className="ml-2 text-[0.75rem] text-ink-faint">
                          ({libelleTableCible(e.table_cible)})
                        </span>
                      </p>
                      {resume && (
                        <p className="truncate font-mono text-[0.8rem] text-brand">
                          {resume}
                        </p>
                      )}
                      <p className="mt-0.5 text-[0.78rem] text-ink-faint">
                        {formaterDate(e.created_at)} à {formaterHeure(e.created_at)}
                        {e.acteur_nom && ` · ${e.acteur_nom}`}
                      </p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Carte>
      </Reveler>
    </>
  );
}