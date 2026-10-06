"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import {
  basculerActifCategorieAction,
  creerCategorieAction,
  modifierCategorieAction,
  supprimerCategorieAction,
  type EtatCategorie,
} from "./actions";
import type { CategorieAvecStats } from "@/lib/types-stock";
import { Carte, MessageErreur, Vide } from "@/components/ui";
import { useSuccesAction } from "@/components/toasts";

const BOUTON_DISCRET =
  "rounded-full px-3.5 py-2 text-[0.85rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink";

export function GestionCategories({ categories }: { categories: CategorieAvecStats[] }) {
  const [creation, setCreation] = useState(categories.length === 0);

  return (
    <div className="space-y-6">
      {creation ? (
        <BlocCreation onFermer={() => setCreation(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreation(true)}
          className="rounded-full bg-ink px-5 py-3 text-[0.9rem] font-medium text-white shadow-flottant transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
        >
          + Ajouter une catégorie
        </button>
      )}

      {categories.length === 0 ? (
        <Carte>
          <Vide>Aucune catégorie. Créez-en une pour organiser vos produits.</Vide>
        </Carte>
      ) : (
        <section className="space-y-3">
          <h2 className="px-1 text-[0.8rem] font-semibold uppercase tracking-[0.14em] text-ink-faint">
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

/* ----------------------------------------------------------- formulaires */

function ChampsCategorie({ categorie }: { categorie?: CategorieAvecStats }) {
  return (
    <div className="grid gap-5 sm:grid-cols-[1fr_2fr]">
      <label className="block">
        <span className="etiquette">Nom *</span>
        <input
          name="nom"
          defaultValue={categorie?.nom}
          className="champ"
          placeholder="Ex. Toners couleur"
          required
          autoComplete="off"
        />
      </label>
      <label className="block">
        <span className="etiquette">Description</span>
        <input
          name="description"
          defaultValue={categorie?.description ?? ""}
          className="champ"
          placeholder="Optionnel"
          autoComplete="off"
        />
      </label>
    </div>
  );
}

function BlocCreation({ onFermer }: { onFermer: () => void }) {
  const [etat, action, enCours] = useActionState<EtatCategorie, FormData>(creerCategorieAction, {});
  useSuccesAction(etat);

  return (
    <Carte>
      <header className="mb-6 flex items-start justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <h2 className="font-display text-[1.2rem] font-semibold tracking-[-0.03em]">Ajouter une catégorie</h2>
          <p className="mt-1 text-[0.85rem] text-ink-faint">
            Exemples : Toners noirs, Toners couleur, Tambours, Développeurs…
          </p>
        </div>
        <button type="button" onClick={onFermer} className={BOUTON_DISCRET}>
          Fermer
        </button>
      </header>

      <form key={etat.token ?? "vierge"} action={action} className="space-y-5">
        <ChampsCategorie />
        {etat.erreur && <MessageErreur>{etat.erreur}</MessageErreur>}
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={enCours}
            className="rounded-full bg-ink px-6 py-3 text-[0.9rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
          >
            {enCours ? "Création…" : "Créer la catégorie"}
          </button>
        </div>
      </form>
    </Carte>
  );
}

function FormulaireEdition({ categorie, onFermer }: { categorie: CategorieAvecStats; onFermer: () => void }) {
  const [etat, action, enCours] = useActionState<EtatCategorie, FormData>(modifierCategorieAction, {});
  useSuccesAction(etat, onFermer);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={categorie.id} />
      <ChampsCategorie categorie={categorie} />
      {etat.erreur && <MessageErreur>{etat.erreur}</MessageErreur>}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onFermer} className={BOUTON_DISCRET}>
          Annuler
        </button>
        <button
          type="submit"
          disabled={enCours}
          className="rounded-full bg-ink px-5 py-2.5 text-[0.9rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.97] disabled:opacity-60"
        >
          {enCours ? "Enregistrement…" : "Enregistrer"}
        </button>
      </div>
    </form>
  );
}

/* ------------------------------------------------------------------ carte */

function CarteCategorie({ categorie }: { categorie: CategorieAvecStats }) {
  const [edition, setEdition] = useState(false);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);

  return (
    <article
      className={`rounded-[1.6rem] p-1.5 ring-1 transition-all duration-700 ease-mass ${
        categorie.actif ? "bg-white/45 ring-white/60 hover:bg-white/70" : "bg-ink/3 ring-hairline"
      }`}
    >
      <div className="rounded-[1.225rem] bg-surface px-5 py-4 sm:px-6">
        {edition ? (
          <FormulaireEdition categorie={categorie} onFermer={() => setEdition(false)} />
        ) : (
          <div className="flex flex-wrap items-center gap-4">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2.5">
                <h3 className="font-display text-[1.2rem] font-semibold tracking-[-0.03em]">{categorie.nom}</h3>
                {!categorie.actif && (
                  <span className="rounded-full bg-ink/6 px-2 py-0.5 text-[0.82rem] font-medium text-ink-soft">
                    Désactivée
                  </span>
                )}
                <Link
                  href="/produits"
                  className="rounded-full bg-navy/7 px-2.5 py-1 text-[0.8rem] text-navy hover:bg-navy/12"
                >
                  {categorie.nb_produits} produit{categorie.nb_produits > 1 ? "s" : ""}
                </Link>
              </div>
              {categorie.description && (
                <p className="mt-1.5 text-[0.88rem] text-ink-soft">{categorie.description}</p>
              )}
            </div>

            <div className="flex shrink-0 flex-wrap items-center gap-1">
              <button type="button" onClick={() => setEdition(true)} className={BOUTON_DISCRET}>
                Modifier
              </button>
              <form action={basculerActifCategorieAction}>
                <input type="hidden" name="id" value={categorie.id} />
                <input type="hidden" name="actif" value={categorie.actif ? "0" : "1"} />
                <button type="submit" className={BOUTON_DISCRET}>
                  {categorie.actif ? "Désactiver" : "Réactiver"}
                </button>
              </form>

              {confirmeSuppression ? (
                <div className="flex items-center gap-1.5">
                  <span className="text-[0.85rem] text-ink-soft">Supprimer ?</span>
                  <form action={supprimerCategorieAction}>
                    <input type="hidden" name="id" value={categorie.id} />
                    <button
                      type="submit"
                      className="rounded-full bg-rouille px-3.5 py-2 text-[0.85rem] font-medium text-white active:scale-[0.97]"
                    >
                      Oui
                    </button>
                  </form>
                  <button type="button" onClick={() => setConfirmeSuppression(false)} className={BOUTON_DISCRET}>
                    Non
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setConfirmeSuppression(true)}
                  className="rounded-full px-3.5 py-2 text-[0.85rem] text-ink-faint transition-all duration-500 ease-mass hover:bg-rouille/10 hover:text-rouille"
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
