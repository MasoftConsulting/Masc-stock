"use client";

import { useActionState, useState } from "react";
import {
  basculerActifCategorieAction,
  creerCategorieAction,
  modifierCategorieAction,
  supprimerCategorieAction,
  type EtatCategorie,
} from "./actions";
import type { CategorieAvecStats } from "@/lib/types-stock";
import { CELLULE, Carte, Grille, MessageErreur, Tableau, Tuile, Vide } from "@/components/ui";
import { BasculeVue, useVue } from "@/components/vue";
import { useSuccesAction } from "@/components/toasts";

const BOUTON_DISCRET =
  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[0.85rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink";

export function GestionCategories({ categories }: { categories: CategorieAvecStats[] }) {
  const [vue, setVue] = useVue("categories");
  const [creation, setCreation] = useState(categories.length === 0);

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        {creation ? (
          <span />
        ) : (
          <button
            type="button"
            onClick={() => setCreation(true)}
            className="rounded-full bg-ink px-5 py-3 text-[0.9rem] font-medium text-white shadow-flottant transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
          >
            + Ajouter une catégorie
          </button>
        )}
        {categories.length > 0 && <BasculeVue vue={vue} onChange={setVue} />}
      </div>

      {creation && <BlocCreation onFermer={() => setCreation(false)} />}

      {categories.length === 0 ? (
        <Carte>
          <Vide>Aucune catégorie. Créez-en une pour organiser vos produits.</Vide>
        </Carte>
      ) : vue === "liste" ? (
        <Tableau
          colonnes={[
            { libelle: "Catégorie" },
            { libelle: "Description", masquerMobile: true },
            { libelle: "Produits", droite: true },
            { libelle: "", droite: true },
          ]}
        >
          {categories.map((c) => (
            <LigneCategorie key={c.id} categorie={c} />
          ))}
        </Tableau>
      ) : (
        <Grille>
          {categories.map((c) => (
            <TuileCategorie key={c.id} categorie={c} />
          ))}
        </Grille>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ vue liste */

function LigneCategorie({ categorie: c }: { categorie: CategorieAvecStats }) {
  const [edition, setEdition] = useState(false);

  return (
    <>
      <tr className={c.actif ? "hover:bg-ink/2" : "bg-ink/2 text-ink-faint"}>
        <td className={`${CELLULE} font-medium`}>
          {c.nom}
          {!c.actif && <span className="ml-2 text-[0.8rem] font-normal">(désactivée)</span>}
        </td>
        <td className={`${CELLULE} hidden text-ink-soft sm:table-cell`}>{c.description ?? "—"}</td>
        <td className={`${CELLULE} text-right font-display text-[1.05rem] font-semibold`}>{c.nb_produits}</td>
        <td className={`${CELLULE} text-right`}>
          <button type="button" onClick={() => setEdition((v) => !v)} aria-expanded={edition} className={BOUTON_DISCRET}>
            {edition ? "Fermer" : "Modifier"}
          </button>
        </td>
      </tr>
      {edition && (
        <tr>
          <td colSpan={4} className="bg-ink/2 px-4 py-5 sm:px-6">
            <PanneauEdition categorie={c} onFermer={() => setEdition(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------ vue grille */

function TuileCategorie({ categorie: c }: { categorie: CategorieAvecStats }) {
  const [edition, setEdition] = useState(false);

  if (edition) {
    return (
      <Tuile large>
        <PanneauEdition categorie={c} onFermer={() => setEdition(false)} />
      </Tuile>
    );
  }

  return (
    <Tuile attenue={!c.actif}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate font-display text-[1.05rem] font-semibold tracking-[-0.02em]">{c.nom}</h3>
          <p className="mt-0.5 line-clamp-2 text-[0.82rem] text-ink-faint">
            {c.description ?? (c.actif ? "Sans description" : "Désactivée")}
          </p>
        </div>
        <p className="shrink-0 text-right">
          <span className="block font-display text-[1.6rem] leading-none font-semibold">{c.nb_produits}</span>
          <span className="text-[0.75rem] text-ink-faint">produit{c.nb_produits > 1 ? "s" : ""}</span>
        </p>
      </div>
      <div className="mt-auto flex justify-end pt-3">
        <button type="button" onClick={() => setEdition(true)} className={BOUTON_DISCRET}>
          Modifier
        </button>
      </div>
    </Tuile>
  );
}

/* ----------------------------------------------------------- formulaires */

function ChampsCategorie({ categorie }: { categorie?: CategorieAvecStats }) {
  return (
    <div className="grid gap-4 sm:grid-cols-[1fr_2fr]">
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

      <form key={etat.token ?? "vierge"} action={action} className="space-y-4">
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

function PanneauEdition({ categorie, onFermer }: { categorie: CategorieAvecStats; onFermer: () => void }) {
  const [etat, action, enCours] = useActionState<EtatCategorie, FormData>(modifierCategorieAction, {});
  useSuccesAction(etat, onFermer);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);

  return (
    <div className="space-y-4">
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

      <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
        <form action={basculerActifCategorieAction}>
          <input type="hidden" name="id" value={categorie.id} />
          <input type="hidden" name="actif" value={categorie.actif ? "0" : "1"} />
          <button type="submit" className={BOUTON_DISCRET}>
            {categorie.actif ? "Désactiver la catégorie" : "Réactiver la catégorie"}
          </button>
        </form>
        {confirmeSuppression ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-[0.85rem] text-ink-soft">Supprimer définitivement ?</span>
            <form action={supprimerCategorieAction}>
              <input type="hidden" name="id" value={categorie.id} />
              <button
                type="submit"
                className="rounded-full bg-rouille px-3.5 py-1.5 text-[0.85rem] font-medium text-white active:scale-[0.97]"
              >
                Oui, supprimer
              </button>
            </form>
            <button type="button" onClick={() => setConfirmeSuppression(false)} className={BOUTON_DISCRET}>
              Non
            </button>
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setConfirmeSuppression(true)}
            className="rounded-full px-3 py-1.5 text-[0.85rem] text-ink-faint transition-all duration-500 ease-mass hover:bg-rouille/10 hover:text-rouille"
          >
            Supprimer
          </button>
        )}
      </div>
    </div>
  );
}
