import type { ReactNode } from "react";

/**
 * Briques d'interface partagées (Server Components, utilisables aussi côté
 * client). Elles reprennent les classes répétées dans les écrans existants.
 */

export function EnTetePage({
  rubrique,
  titre,
  children,
  avant,
}: {
  rubrique: string;
  titre: ReactNode;
  /** Texte d'introduction sous le titre. */
  children?: ReactNode;
  /** Contenu au-dessus de la rubrique (lien retour…). */
  avant?: ReactNode;
}) {
  return (
    <header className="pt-8 md:pt-14">
      {avant && <div>{avant}</div>}
      <span
        className={`inline-flex items-center gap-2 rounded-full bg-ink/5 px-3 py-1 text-[0.75rem] font-medium uppercase tracking-[0.2em] text-ink-soft ${
          avant ? "mt-6" : ""
        }`}
      >
        <span className="h-1.5 w-1.5 rounded-full bg-brand" />
        {rubrique}
      </span>
      <h1 className="mt-6 font-display text-[2.6rem] leading-[0.95] font-semibold tracking-[-0.045em] sm:text-[3.6rem]">
        {titre}
      </h1>
      {children && (
        <div className="mt-4 max-w-lg text-[0.9rem] leading-relaxed text-ink-soft">
          {children}
        </div>
      )}
    </header>
  );
}

/** Carte à double bordure (verre dépoli + surface blanche). */
export function Carte({
  children,
  className = "",
  interieur = "p-6 sm:p-8",
}: {
  children: ReactNode;
  className?: string;
  /** Classes du bloc intérieur (marges). */
  interieur?: string;
}) {
  return (
    <section
      className={`rounded-4xl bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant ${className}`}
    >
      <div
        className={`rounded-[1.625rem] bg-surface shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] ${interieur}`}
      >
        {children}
      </div>
    </section>
  );
}

/** Titre de section à l'intérieur d'une carte. */
export function TitreSection({
  titre,
  detail,
  action,
}: {
  titre: string;
  detail?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <header className="mb-5 flex flex-wrap items-end justify-between gap-3 border-b border-hairline pb-4">
      <div>
        <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
          {titre}
        </h2>
        {detail && <p className="mt-1 text-[0.82rem] text-ink-faint">{detail}</p>}
      </div>
      {action}
    </header>
  );
}

const TONS = {
  neutre: "text-ink",
  jade: "text-jade",
  amber: "text-amber",
  rouille: "text-rouille",
} as const;

/** Indicateur chiffré (tableau de bord, fiche client). */
export function Indicateur({
  libelle,
  valeur,
  detail,
  ton = "neutre",
}: {
  libelle: string;
  valeur: ReactNode;
  detail?: ReactNode;
  ton?: keyof typeof TONS;
}) {
  return (
    <div className="rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60">
      <div className="h-full rounded-[1.225rem] bg-surface px-5 py-4">
        <p className="etiquette">{libelle}</p>
        <p
          className={`font-display text-[1.9rem] leading-none font-semibold tracking-[-0.04em] ${TONS[ton]}`}
        >
          {valeur}
        </p>
        {detail && <p className="mt-2 text-[0.8rem] text-ink-faint">{detail}</p>}
      </div>
    </div>
  );
}

/** Bandeau de résultat sous l'en-tête de page (après une redirection). */
export function Bandeau({
  ton,
  children,
}: {
  ton: "succes" | "erreur";
  children: ReactNode;
}) {
  return (
    <p
      role={ton === "erreur" ? "alert" : "status"}
      className={`mt-8 rounded-2xl px-5 py-3.5 text-[0.9rem] ${
        ton === "succes" ? "bg-jade/10 text-jade" : "bg-rouille/10 text-rouille"
      }`}
    >
      {children}
    </p>
  );
}

/** Message d'erreur dans un formulaire. */
export function MessageErreur({ children }: { children: ReactNode }) {
  return (
    <p role="alert" className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.88rem] text-rouille">
      {children}
    </p>
  );
}

/**
 * Tableau compact dans une carte. Défilement horizontal sur petit écran ;
 * une colonne marquée `masquerMobile` disparaît sous 640 px.
 */
export function Tableau({
  colonnes,
  children,
}: {
  colonnes: { libelle: string; droite?: boolean; masquerMobile?: boolean }[];
  children: ReactNode;
}) {
  return (
    <section className="rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
      <div className="overflow-x-auto rounded-[1.225rem] bg-surface">
        <table className="w-full text-left text-[0.9rem]">
          <thead>
            <tr className="border-b border-hairline text-[0.75rem] uppercase tracking-[0.08em] text-ink-faint">
              {colonnes.map((c, i) => (
                <th
                  key={i}
                  scope="col"
                  className={`px-4 py-3 font-medium whitespace-nowrap ${c.droite ? "text-right" : ""} ${
                    c.masquerMobile ? "hidden sm:table-cell" : ""
                  }`}
                >
                  {c.libelle}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-hairline">{children}</tbody>
        </table>
      </div>
    </section>
  );
}

/** Classes d'une cellule de `Tableau`. */
export const CELLULE = "px-4 py-3 align-middle";

/** Tuile compacte pour la vue grille. */
export function Tuile({
  children,
  attenue = false,
  large = false,
}: {
  children: ReactNode;
  /** Élément désactivé ou annulé. */
  attenue?: boolean;
  /** Occupe toute la largeur (formulaire d'édition ouvert). */
  large?: boolean;
}) {
  return (
    <article
      className={`flex flex-col rounded-[1.4rem] p-1 ring-1 transition-all duration-500 ease-mass ${
        attenue ? "bg-ink/3 ring-hairline" : "bg-white/45 ring-white/60 hover:bg-white/75"
      } ${large ? "sm:col-span-2 lg:col-span-3" : ""}`}
    >
      <div className="flex flex-1 flex-col rounded-[1.1rem] bg-surface p-4">{children}</div>
    </article>
  );
}

/** Conteneur de la vue grille. */
export function Grille({ children }: { children: ReactNode }) {
  return <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{children}</div>;
}

/** Message vide à l'intérieur d'une carte. */
export function Vide({ children }: { children: ReactNode }) {
  return (
    <p className="py-6 text-center text-[0.85rem] text-ink-faint">{children}</p>
  );
}
