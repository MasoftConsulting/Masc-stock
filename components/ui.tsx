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
      {avant}
      <span
        className={`inline-flex items-center gap-2 rounded-full bg-ink/5 px-3 py-1 text-[10px] font-medium uppercase tracking-[0.2em] text-ink-soft ${
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
        {detail && <p className="mt-1 text-[0.76rem] text-ink-faint">{detail}</p>}
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
        {detail && <p className="mt-2 text-[0.72rem] text-ink-faint">{detail}</p>}
      </div>
    </div>
  );
}

/** Message vide à l'intérieur d'une carte. */
export function Vide({ children }: { children: ReactNode }) {
  return (
    <p className="py-6 text-center text-[0.85rem] text-ink-faint">{children}</p>
  );
}
