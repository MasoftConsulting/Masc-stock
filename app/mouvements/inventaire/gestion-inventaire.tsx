"use client";

import { useActionState, useMemo, useState } from "react";
import {
  validerInventaireAction,
  type EtatMouvement,
} from "../actions";
import type { ProduitAvecStock } from "@/lib/types-stock";

export function GestionInventaire({
  produits,
}: {
  produits: ProduitAvecStock[];
}) {
  const [recherche, setRecherche] = useState("");
  const [comptes, setComptes] = useState<Record<string, string>>({});
  const [etat, action, enCours] = useActionState<EtatMouvement, FormData>(
    validerInventaireAction,
    {},
  );

  // Les produits hors recherche sont masqués, pas retirés du formulaire :
  // sinon leurs quantités déjà saisies ne seraient pas envoyées.
  const visibles = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return new Set(
      produits
        .filter(
          (p) =>
            !terme ||
            p.nom.toLowerCase().includes(terme) ||
            p.reference.toLowerCase().includes(terme),
        )
        .map((p) => p.id),
    );
  }, [produits, recherche]);

  /** Compte les écarts non nuls parmi les champs remplis. */
  const ecarts = useMemo(() => {
    let positifs = 0;
    let negatifs = 0;
    for (const p of produits) {
      const brut = comptes[p.id];
      if (!brut || brut.trim() === "") continue;
      const compte = Number(brut);
      if (!Number.isFinite(compte)) continue;
      const ecart = Math.trunc(compte) - p.quantite;
      if (ecart > 0) positifs++;
      else if (ecart < 0) negatifs++;
    }
    return { positifs, negatifs, total: positifs + negatifs };
  }, [produits, comptes]);

  if (produits.length === 0) {
    return (
      <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
        <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-16 text-center">
          <p className="font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
            Aucun produit à inventorier
          </p>
          <p className="mx-auto mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
            Créez d&apos;abord des produits dans la section Produits.
          </p>
        </div>
      </div>
    );
  }

  return (
    <form action={action} className="space-y-6">
      <div className="rounded-[1.75rem] bg-white/50 p-1.5 ring-1 ring-white/70 shadow-flottant backdrop-blur-xl">
        <div className="grid gap-3 rounded-[calc(1.75rem-0.375rem)] bg-surface p-4 sm:grid-cols-[2fr_1fr]">
          <label className="block">
            <span className="etiquette">Rechercher un produit</span>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="champ"
              placeholder="Référence, nom…"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="etiquette">Note (optionnel)</span>
            <input
              name="note"
              className="champ"
              placeholder="Ex. Inventaire Q4 2026"
              autoComplete="off"
            />
          </label>
        </div>
      </div>

      <section className="space-y-2">
        {produits.map((p) => {
          const brut = comptes[p.id] ?? "";
          const compte = brut.trim() === "" ? null : Number(brut);
          const ecart =
            compte !== null && Number.isFinite(compte)
              ? Math.trunc(compte) - p.quantite
              : 0;

          return (
            <article
              key={p.id}
              hidden={!visibles.has(p.id)}
              className="rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60"
            >
              <div className="rounded-[calc(1.6rem-0.375rem)] bg-surface px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-6">
                <div className="flex flex-wrap items-center gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-2.5">
                      <span className="font-mono text-[0.72rem] tracking-[0.06em] text-brand">
                        {p.reference}
                      </span>
                      {p.categorie_nom && (
                        <span className="rounded-full bg-navy/[0.07] px-2 py-0.5 text-[0.62rem] text-navy">
                          {p.categorie_nom}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 truncate text-[0.9rem] text-ink">
                      {p.nom}
                    </p>
                    <p className="mt-1 text-[0.72rem] text-ink-faint">
                      Théorique : {p.quantite}
                    </p>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      step={1}
                      value={brut}
                      onChange={(e) =>
                        setComptes((prev) => ({
                          ...prev,
                          [p.id]: e.target.value,
                        }))
                      }
                      name={`compte_${p.id}`}
                      placeholder="—"
                      className="champ w-24 font-mono text-center"
                    />

                    {compte !== null && Number.isFinite(compte) && (
                      <span
                        className={`min-w-[3.5rem] rounded-full px-2.5 py-1 text-center font-mono text-[0.72rem] ${
                          ecart === 0
                            ? "bg-ink/[0.05] text-ink-soft"
                            : ecart > 0
                              ? "bg-jade/10 text-jade"
                              : "bg-rouille/10 text-rouille"
                        }`}
                      >
                        {ecart === 0 ? "=" : ecart > 0 ? `+${ecart}` : `${ecart}`}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {etat.erreur && (
        <p className="rounded-2xl bg-rouille/10 px-5 py-3.5 text-[0.85rem] text-rouille">
          {etat.erreur}
        </p>
      )}

      <div className="sticky bottom-4 z-10 flex justify-center">
        <div className="flex items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-white shadow-flottant">
          <span className="text-[0.85rem]">
            {ecarts.total === 0
              ? "Aucun écart détecté"
              : `${ecarts.total} écart${ecarts.total > 1 ? "s" : ""} à ajuster`}
          </span>
          <button
            type="submit"
            disabled={enCours || ecarts.total === 0}
            className="rounded-full bg-white/12 px-5 py-2 text-[0.85rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-white/20 active:scale-[0.98] disabled:opacity-40"
          >
            {enCours ? "Validation…" : "Valider l'inventaire"}
          </button>
        </div>
      </div>
    </form>
  );
}