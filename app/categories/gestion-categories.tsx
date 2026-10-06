"use client";

import { useActionState, useCallback, useEffect, useState } from "react";
import {
  basculerActifCategorieAction,
  creerCategorieAction,
  modifierCategorieAction,
  supprimerCategorieAction,
  type EtatCategorie,
} from "./actions";
import type { CategorieAvecStats } from "@/lib/types-stock";

export function GestionCategories({
  categories,
}: {
  categories: CategorieAvecStats[];
}) {
  return (
    <div className="space-y-8">
      <BlocCreation />
      {categories.length === 0 ? (
        <BlocVide />
      ) : (
        <section className="space-y-3">
          <h2 className="px-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
            {categories.length} catégorie{categories.length > 1 ? "s" : ""}
          </h2>
          {categories.map((c) => (
            <CarteCategorie key={c.id} categorie={c} />
          ))}
        </section>
      )}
    </div>
  );
}

/* --------------------------------------------------------- création */

function BlocCreation() {
  const [etat, action, enCours] = useActionState<EtatCategorie, FormData>(
    creerCategorieAction,
    {},
  );

  return (
    <section className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
      <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
        <header className="mb-6 flex items-baseline gap-4 border-b border-hairline pb-5">
          <span className="font-mono text-[0.7rem] text-brand">+</span>
          <div>
            <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
              Ajouter une catégorie
            </h2>
            <p className="mt-1 text-[0.76rem] text-ink-faint">
              Exemples : Toners noirs, Toners couleur, Tambours, Fours,
              Courroies…
            </p>
          </div>
        </header>

        <form
          key={etat.token ?? "form-vierge"}
          action={action}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
            <label className="block">
              <span className="etiquette">Nom *</span>
              <input
                name="nom"
                className="champ"
                placeholder="Ex. Toners noirs"
                required
                autoComplete="off"
                autoFocus
              />
            </label>
            <label className="block">
              <span className="etiquette">Description</span>
              <input
                name="description"
                className="champ"
                placeholder="Optionnel"
                autoComplete="off"
              />
            </label>
          </div>

          {etat.erreur && (
            <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
              {etat.erreur}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="submit"
              disabled={enCours}
              className="rounded-full bg-ink px-6 py-3 text-[0.88rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
            >
              {enCours ? "Création…" : "Créer la catégorie"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

function BlocVide() {
  return (
    <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
      <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-16 text-center">
        <p className="font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
          Aucune catégorie
        </p>
        <p className="mx-auto mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
          Créez votre première catégorie ci-dessus pour organiser vos
          produits.
        </p>
      </div>
    </div>
  );
}

/* ----------------------------------------------------- carte + édition */

function CarteCategorie({ categorie }: { categorie: CategorieAvecStats }) {
  const [edition, setEdition] = useState(false);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);

  const fermerEdition = useCallback(() => setEdition(false), []);

  return (
    <article
      className={`rounded-[1.6rem] p-1.5 ring-1 transition-all duration-700 ease-mass ${
        categorie.actif
          ? "bg-white/45 ring-white/60 hover:bg-white/70"
          : "bg-ink/[0.03] ring-hairline"
      }`}
    >
      <div className="rounded-[calc(1.6rem-0.375rem)] bg-surface px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-6">
        {edition ? (
          <FormulaireEdition
            categorie={categorie}
            onFermer={fermerEdition}
          />
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
                  {categorie.nom}
                </h3>
                {!categorie.actif && (
                  <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-soft">
                    Désactivée
                  </span>
                )}
                <span className="rounded-full bg-navy/[0.07] px-2.5 py-1 text-[0.68rem] text-navy">
                  {categorie.nb_produits} produit
                  {categorie.nb_produits > 1 ? "s" : ""}
                </span>
              </div>
              {categorie.description && (
                <p className="mt-1.5 text-[0.8rem] text-ink-soft">
                  {categorie.description}
                </p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-1">
              <button
                type="button"
                onClick={() => setEdition(true)}
                className="rounded-full px-3 py-2 text-[0.75rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
              >
                Modifier
              </button>

              <form action={basculerActifCategorieAction}>
                <input type="hidden" name="id" value={categorie.id} />
                <input
                  type="hidden"
                  name="actif"
                  value={categorie.actif ? "0" : "1"}
                />
                <button
                  type="submit"
                  className="rounded-full px-3 py-2 text-[0.75rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
                >
                  {categorie.actif ? "Désactiver" : "Réactiver"}
                </button>
              </form>

              {confirmeSuppression ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.72rem] text-ink-soft">
                    Confirmer ?
                  </span>
                  <form action={supprimerCategorieAction}>
                    <input type="hidden" name="id" value={categorie.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-rouille px-3 py-2 text-[0.75rem] font-medium text-white transition-all duration-500 ease-mass active:scale-[0.97]"
                    >
                      Oui
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setConfirmeSuppression(false)}
                    className="rounded-full px-3 py-2 text-[0.75rem] text-ink-faint hover:text-ink"
                  >
                    Non
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmeSuppression(true)}
                  className="rounded-full px-3 py-2 text-[0.75rem] text-ink-faint transition-all duration-500 ease-mass hover:bg-rouille/10 hover:text-rouille"
                >
                  Supprimer
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </article>
  );
}

/* -------------------------------------------------------- formulaire édition */

function FormulaireEdition({
  categorie,
  onFermer,
}: {
  categorie: CategorieAvecStats;
  onFermer: () => void;
}) {
  const [etat, action, enCours] = useActionState<EtatCategorie, FormData>(
    modifierCategorieAction,
    {},
  );

  // Ferme automatiquement le formulaire d'édition quand l'enregistrement
  // réussit. Le token change à chaque succès, ce qui déclenche l'effet.
  useEffect(() => {
    if (etat.token) onFermer();
  }, [etat.token, onFermer]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={categorie.id} />

      <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
        <label className="block">
          <span className="etiquette">Nom *</span>
          <input
            name="nom"
            defaultValue={categorie.nom}
            className="champ"
            required
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="etiquette">Description</span>
          <input
            name="description"
            defaultValue={categorie.description ?? ""}
            className="champ"
            autoComplete="off"
          />
        </label>
      </div>

      {etat.erreur && (
        <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
          {etat.erreur}
        </p>
      )}

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onFermer}
          className="rounded-full px-4 py-2 text-[0.82rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={enCours}
          className="rounded-full bg-ink px-5 py-2.5 text-[0.82rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.97] disabled:opacity-60"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}