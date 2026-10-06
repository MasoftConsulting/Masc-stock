"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  basculerActifProduitAction,
  creerProduitAction,
  modifierProduitAction,
  supprimerProduitAction,
  type EtatProduit,
} from "./actions";
import {
  statutStock,
  type ProduitAvecStock,
  type Categorie,
} from "@/lib/types-stock";

export function GestionProduits({
  produits,
  categories,
}: {
  produits: ProduitAvecStock[];
  categories: Categorie[];
}) {
  const [recherche, setRecherche] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState<"" | "bas" | "rupture">("");

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();

    return produits.filter((p) => {
      if (terme) {
        const match =
          p.nom.toLowerCase().includes(terme) ||
          p.reference.toLowerCase().includes(terme) ||
          (p.description ?? "").toLowerCase().includes(terme);
        if (!match) return false;
      }

      if (categorieFiltre && p.categorie_id !== categorieFiltre) return false;

      if (statutFiltre) {
        const statut = statutStock(p.quantite, p.seuil_alerte);
        if (statutFiltre === "bas" && statut === "ok") return false;
        if (statutFiltre === "rupture" && statut !== "rupture") return false;
      }

      return true;
    });
  }, [produits, recherche, categorieFiltre, statutFiltre]);

  const aDesFiltres = Boolean(recherche || categorieFiltre || statutFiltre);

  return (
    <div className="space-y-6">
      <BlocCreation categories={categories} />

      <BarreFiltres
        recherche={recherche}
        setRecherche={setRecherche}
        categorieFiltre={categorieFiltre}
        setCategorieFiltre={setCategorieFiltre}
        statutFiltre={statutFiltre}
        setStatutFiltre={setStatutFiltre}
        categories={categories}
        nombreResultats={filtres.length}
        total={produits.length}
      />

      {produits.length === 0 ? (
        <BlocVide />
      ) : filtres.length === 0 ? (
        <BlocAucunResultat
          onReset={() => {
            setRecherche("");
            setCategorieFiltre("");
            setStatutFiltre("");
          }}
        />
      ) : (
        <section className="space-y-3">
          {filtres.map((p) => (
            <CarteProduit key={p.id} produit={p} categories={categories} />
          ))}
        </section>
      )}

      {aDesFiltres && filtres.length > 0 && (
        <p className="text-center text-[0.78rem] text-ink-faint">
          {filtres.length} produit{filtres.length > 1 ? "s" : ""} affiché
          {filtres.length > 1 ? "s" : ""} sur {produits.length}
        </p>
      )}
    </div>
  );
}

/* --------------------------------------------------------- création */

function BlocCreation({ categories }: { categories: Categorie[] }) {
  const [etat, action, enCours] = useActionState<EtatProduit, FormData>(
    creerProduitAction,
    {},
  );

  return (
    <section className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
      <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
        <header className="mb-6 flex items-baseline gap-4 border-b border-hairline pb-5">
          <span className="font-mono text-[0.7rem] text-brand">+</span>
          <div>
            <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
              Ajouter un produit
            </h2>
            <p className="mt-1 text-[0.76rem] text-ink-faint">
              La référence doit être unique. Le stock initial est à 0, il
              évoluera avec les mouvements.
            </p>
          </div>
        </header>

        <form
          key={etat.token ?? "form-vierge"}
          action={action}
          className="space-y-5"
        >
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="etiquette">Référence *</span>
              <input
                name="reference"
                className="champ font-mono"
                placeholder="Ex. MX-51NTBA"
                required
                autoComplete="off"
              />
            </label>
            <label className="block">
              <span className="etiquette">Nom *</span>
              <input
                name="nom"
                className="champ"
                placeholder="Ex. Toner noir Sharp MX-51"
                required
                autoComplete="off"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-[1fr_1fr_1fr]">
            <label className="block">
              <span className="etiquette">Catégorie</span>
              <select name="categorie_id" className="champ" defaultValue="">
                <option value="">— Non classé —</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </label>
            <label className="block">
              <span className="etiquette">Seuil d&apos;alerte</span>
              <input
                name="seuil_alerte"
                type="number"
                min={0}
                step={1}
                defaultValue={0}
                className="champ font-mono"
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
              {enCours ? "Création…" : "Créer le produit"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- filtres */

function BarreFiltres({
  recherche,
  setRecherche,
  categorieFiltre,
  setCategorieFiltre,
  statutFiltre,
  setStatutFiltre,
  categories,
  nombreResultats,
  total,
}: {
  recherche: string;
  setRecherche: (v: string) => void;
  categorieFiltre: string;
  setCategorieFiltre: (v: string) => void;
  statutFiltre: "" | "bas" | "rupture";
  setStatutFiltre: (v: "" | "bas" | "rupture") => void;
  categories: Categorie[];
  nombreResultats: number;
  total: number;
}) {
  const aFiltre = Boolean(recherche || categorieFiltre || statutFiltre);

  return (
    <div className="rounded-[1.75rem] bg-white/50 p-1.5 ring-1 ring-white/70 shadow-flottant backdrop-blur-xl">
      <div className="grid gap-3 rounded-[calc(1.75rem-0.375rem)] bg-surface p-4 sm:grid-cols-[2fr_1fr_1fr]">
        <label className="block">
          <span className="etiquette">Rechercher</span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="champ"
            placeholder="Référence, nom, description…"
            autoComplete="off"
          />
        </label>

        <label className="block">
          <span className="etiquette">Catégorie</span>
          <select
            value={categorieFiltre}
            onChange={(e) => setCategorieFiltre(e.target.value)}
            className="champ"
          >
            <option value="">Toutes</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="etiquette">Stock</span>
          <select
            value={statutFiltre}
            onChange={(e) =>
              setStatutFiltre(e.target.value as "" | "bas" | "rupture")
            }
            className="champ"
          >
            <option value="">Tous</option>
            <option value="bas">Sous le seuil</option>
            <option value="rupture">En rupture</option>
          </select>
        </label>
      </div>

      {aFiltre && (
        <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
          <span className="text-[0.78rem] text-ink-soft">
            {nombreResultats} sur {total}
          </span>
          <button
            type="button"
            onClick={() => {
              setRecherche("");
              setCategorieFiltre("");
              setStatutFiltre("");
            }}
            className="text-[0.78rem] text-ink-soft underline underline-offset-4 transition-colors duration-500 ease-mass hover:text-ink"
          >
            Effacer les filtres
          </button>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------- vide */

function BlocVide() {
  return (
    <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
      <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-16 text-center">
        <p className="font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
          Aucun produit
        </p>
        <p className="mx-auto mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
          Créez votre première référence ci-dessus. Le stock démarrera à 0
          et évoluera avec les mouvements.
        </p>
      </div>
    </div>
  );
}

function BlocAucunResultat({ onReset }: { onReset: () => void }) {
  return (
    <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
      <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-12 text-center">
        <p className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
          Aucun produit ne correspond
        </p>
        <p className="mx-auto mt-3 max-w-md text-[0.85rem] leading-relaxed text-ink-soft">
          Élargissez la recherche ou retirez les filtres.
        </p>
        <button
          type="button"
          onClick={onReset}
          className="mt-6 rounded-full bg-ink/5 px-5 py-2.5 text-[0.82rem] font-medium text-ink transition-all duration-500 ease-mass hover:bg-ink/10"
        >
          Effacer les filtres
        </button>
      </div>
    </div>
  );
}

/* --------------------------------------------------------- carte produit */

function CarteProduit({
  produit,
  categories,
}: {
  produit: ProduitAvecStock;
  categories: Categorie[];
}) {
  const [edition, setEdition] = useState(false);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);
  const statut = statutStock(produit.quantite, produit.seuil_alerte);

  return (
    <article
      className={`rounded-[1.6rem] p-1.5 ring-1 transition-all duration-700 ease-mass ${
        produit.actif
          ? "bg-white/45 ring-white/60 hover:bg-white/70"
          : "bg-ink/[0.03] ring-hairline"
      }`}
    >
      <div className="rounded-[calc(1.6rem-0.375rem)] bg-surface px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-6">
        {edition ? (
          <FormulaireEdition
            produit={produit}
            categories={categories}
            onFermer={() => setEdition(false)}
          />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-[0.72rem] tracking-[0.06em] text-brand">
                    {produit.reference}
                  </span>
                  {!produit.actif && (
                    <span className="rounded-full bg-ink/[0.06] px-2 py-0.5 text-[0.62rem] font-medium uppercase tracking-[0.1em] text-ink-soft">
                      Désactivé
                    </span>
                  )}
                </div>
                <h3 className="mt-1.5 font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
                  {produit.nom}
                </h3>
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  {produit.categorie_nom ? (
                    <span className="rounded-full bg-navy/[0.07] px-2.5 py-1 text-[0.68rem] text-navy">
                      {produit.categorie_nom}
                    </span>
                  ) : (
                    <span className="rounded-full bg-ink/[0.04] px-2.5 py-1 text-[0.68rem] text-ink-faint">
                      Non classé
                    </span>
                  )}
                  {produit.description && (
                    <span className="text-[0.76rem] text-ink-soft">
                      {produit.description}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-5">
                <div className="text-right">
                  <p
                    className={`font-display text-[1.6rem] leading-none font-semibold tracking-[-0.04em] ${
                      statut === "rupture"
                        ? "text-rouille"
                        : statut === "bas"
                          ? "text-amber"
                          : "text-ink"
                    }`}
                  >
                    {produit.quantite}
                  </p>
                  <p className="mt-1.5 text-[0.66rem] text-ink-faint">
                    seuil {produit.seuil_alerte}
                  </p>
                </div>

                <BadgeStatut statut={statut} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-hairline pt-4">
              <button
                type="button"
                onClick={() => setEdition(true)}
                className="rounded-full px-3 py-2 text-[0.75rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
              >
                Modifier
              </button>

              <form action={basculerActifProduitAction}>
                <input type="hidden" name="id" value={produit.id} />
                <input
                  type="hidden"
                  name="actif"
                  value={produit.actif ? "0" : "1"}
                />
                <button
                  type="submit"
                  className="rounded-full px-3 py-2 text-[0.75rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
                >
                  {produit.actif ? "Désactiver" : "Réactiver"}
                </button>
              </form>

              <div className="ml-auto">
                {confirmeSuppression ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[0.75rem] text-ink-soft">
                      Confirmer ?
                    </span>
                    <form action={supprimerProduitAction}>
                      <input type="hidden" name="id" value={produit.id} />
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
          </>
        )}
      </div>
    </article>
  );
}

function BadgeStatut({ statut }: { statut: "ok" | "bas" | "rupture" }) {
  if (statut === "rupture") {
    return (
      <span className="rounded-full bg-rouille/10 px-3 py-1.5 text-[0.68rem] font-medium text-rouille">
        Rupture
      </span>
    );
  }
  if (statut === "bas") {
    return (
      <span className="rounded-full bg-amber/10 px-3 py-1.5 text-[0.68rem] font-medium text-amber">
        Bas
      </span>
    );
  }
  return (
    <span className="rounded-full bg-jade/10 px-3 py-1.5 text-[0.68rem] font-medium text-jade">
      OK
    </span>
  );
}

/* ---------------------------------------------------- édition inline */

function FormulaireEdition({
  produit,
  categories,
  onFermer,
}: {
  produit: ProduitAvecStock;
  categories: Categorie[];
  onFermer: () => void;
}) {
  const [etat, action, enCours] = useActionState<EtatProduit, FormData>(
    modifierProduitAction,
    {},
  );

  useEffect(() => {
    if (etat.token) onFermer();
  }, [etat.token, onFermer]);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="id" value={produit.id} />

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="etiquette">Référence *</span>
          <input
            name="reference"
            defaultValue={produit.reference}
            className="champ font-mono"
            required
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="etiquette">Nom *</span>
          <input
            name="nom"
            defaultValue={produit.nom}
            className="champ"
            required
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <label className="block">
          <span className="etiquette">Catégorie</span>
          <select
            name="categorie_id"
            defaultValue={produit.categorie_id ?? ""}
            className="champ"
          >
            <option value="">— Non classé —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="etiquette">Seuil d&apos;alerte</span>
          <input
            name="seuil_alerte"
            type="number"
            min={0}
            step={1}
            defaultValue={produit.seuil_alerte}
            className="champ font-mono"
          />
        </label>
        <label className="block">
          <span className="etiquette">Description</span>
          <input
            name="description"
            defaultValue={produit.description ?? ""}
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