import { z } from "zod";

/**
 * Période d'analyse lue dans l'URL (`?periode=mois` ou `?du=…&au=…`).
 *
 * Module pur : utilisé par les pages, les téléchargements (PDF / CSV) et
 * testable sans Next. Les dates sont en UTC, comme `current_date` côté base.
 */

export const PERIODES = {
  mois: "Ce mois-ci",
  annee: "Cette année",
  "12mois": "12 derniers mois",
  tout: "Tout l'historique",
} as const;

export type CodePeriode = keyof typeof PERIODES;

export type Periode = {
  code: CodePeriode | "personnalisee";
  /** Bornes incluses (YYYY-MM-DD) ; null = pas de borne. */
  du: string | null;
  au: string | null;
  libelle: string;
};

function iso(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function formaterJour(valeur: string): string {
  const [a, m, j] = valeur.split("-");
  return `${j}/${m}/${a}`;
}

const schemaParams = z.object({
  periode: z.enum(Object.keys(PERIODES) as [CodePeriode, ...CodePeriode[]]).optional().catch(undefined),
  du: z.iso.date().optional().catch(undefined),
  au: z.iso.date().optional().catch(undefined),
});

/**
 * Construit la période à partir des paramètres d'URL. Toute valeur invalide
 * est ignorée (on retombe sur la période par défaut) plutôt que de planter.
 */
export function lirePeriode(
  params: Record<string, string | string[] | undefined>,
  parDefaut: CodePeriode = "tout",
  maintenant: Date = new Date(),
): Periode {
  const { periode, du, au } = schemaParams.parse({
    periode: params.periode,
    du: params.du,
    au: params.au,
  });

  if (!periode && (du || au)) {
    const [debut, fin] = du && au && du > au ? [au, du] : [du, au];
    return {
      code: "personnalisee",
      du: debut ?? null,
      au: fin ?? null,
      libelle:
        debut && fin
          ? `Du ${formaterJour(debut)} au ${formaterJour(fin)}`
          : debut
            ? `Depuis le ${formaterJour(debut)}`
            : `Jusqu'au ${formaterJour(fin!)}`,
    };
  }

  const code = periode ?? parDefaut;
  const aujourdhui = iso(maintenant);
  const annee = maintenant.getUTCFullYear();
  const mois = maintenant.getUTCMonth();

  const debut: Record<CodePeriode, string | null> = {
    mois: iso(new Date(Date.UTC(annee, mois, 1))),
    annee: iso(new Date(Date.UTC(annee, 0, 1))),
    "12mois": iso(new Date(Date.UTC(annee - 1, mois, maintenant.getUTCDate() + 1))),
    tout: null,
  };

  return {
    code,
    du: debut[code],
    au: code === "tout" ? null : aujourdhui,
    libelle: PERIODES[code],
  };
}

/** Paramètres d'URL représentant une période (pour les liens de téléchargement). */
export function parametresPeriode(periode: Periode): string {
  const params = new URLSearchParams();
  if (periode.code === "personnalisee") {
    if (periode.du) params.set("du", periode.du);
    if (periode.au) params.set("au", periode.au);
  } else {
    params.set("periode", periode.code);
  }
  return params.toString();
}
