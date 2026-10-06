"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  basculerActifProduitAction,
  creerProduitAction,
  modifierProduitAction,
  supprimerProduitAction,
  type EtatProduit,
} from "./actions";
import { statutStock, type Categorie, type ProduitAvecStock, type StatutStock } from "@/lib/types-stock";
import { correspond, normaliser } from "@/lib/format";
import { Carte, MessageErreur, Vide } from "@/components/ui";
import { useSuccesAction } from "@/components/toasts";

type FiltreStatut = "" | "bas" | "rupture";

const BOUTON_DISCRET =
  "rounded-full px-3.5 py-2 text-[0.85rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink";

export function GestionProduits({
  produits,
  categories,
}: {
  produits: ProduitAvecStock[];
  categories: Categorie[];
}) {
  const [creation, setCreation] = useState(produits.length === 0);
  const [recherche, setRecherche] = useState("");
  const [categorieFiltre, setCategorieFiltre] = useState("");
  const [statutFiltre, setStatutFiltre] = useState<FiltreStatut>("");

  const filtres = useMemo(() => {
    const terme = normaliser(recherche);
    return produits.filter((p) => {
      if (!correspond(terme, p.reference, p.nom, p.description, p.compatibilite, p.categorie_nom)) {
        return false;
      }
      if (categorieFiltre && p.categorie_id !== categorieFiltre) return false;
      const statut = statutStock(p.quantite, p.seuil_alerte);
      if (statutFiltre === "bas" && statut === "ok") return false;
      if (statutFiltre === "rupture" && statut !== "rupture") return false;
      return true;
    });
  }, [produits, recherche, categorieFiltre, statutFiltre]);

  const aDesFiltres = Boolean(recherche || categorieFiltre || statutFiltre);
  const effacer = () => {
    setRecherche("");
    setCategorieFiltre("");
    setStatutFiltre("");
  };

  return (
    <div className="space-y-6">
      {creation ? (
        <BlocCreation categories={categories} onFermer={() => setCreation(false)} />
      ) : (
        <button
          type="button"
          onClick={() => setCreation(true)}
          className="rounded-full bg-ink px-5 py-3 text-[0.9rem] font-medium text-white shadow-flottant transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98]"
        >
          + Ajouter un produit
        </button>
      )}

      {produits.length > 0 && (
        <Carte interieur="grid gap-3 p-4 sm:grid-cols-[2fr_1fr_1fr]">
          <label className="block">
            <span className="etiquette">Rechercher</span>
            <input
              type="search"
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="champ"
              placeholder="Référence, nom, imprimante…"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="etiquette">Catégorie</span>
            <select value={categorieFiltre} onChange={(e) => setCategorieFiltre(e.target.value)} className="champ">
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
              onChange={(e) => setStatutFiltre(e.target.value as FiltreStatut)}
              className="champ"
            >
              <option value="">Tous</option>
              <option value="bas">À réapprovisionner</option>
              <option value="rupture">En rupture</option>
            </select>
          </label>
          {aDesFiltres && (
            <div className="flex items-center justify-between gap-2 sm:col-span-3">
              <span className="text-[0.85rem] text-ink-soft">
                {filtres.length} sur {produits.length}
              </span>
              <button
                type="button"
                onClick={effacer}
                className="text-[0.85rem] text-ink-soft underline underline-offset-4 hover:text-ink"
              >
                Effacer les filtres
              </button>
            </div>
          )}
        </Carte>
      )}

      {produits.length === 0 ? (
        <Carte>
          <Vide>Aucun produit. Créez votre première référence ci-dessus.</Vide>
        </Carte>
      ) : filtres.length === 0 ? (
        <Carte>
          <Vide>
            Aucun produit ne correspond.{" "}
            <button type="button" onClick={effacer} className="underline underline-offset-4 hover:text-ink">
              Effacer les filtres
            </button>
          </Vide>
        </Carte>
      ) : (
        <section className="space-y-3">
          {filtres.map((p) => (
            <CarteProduit key={p.id} produit={p} categories={categories} />
          ))}
        </section>
      )}
    </div>
  );
}

/* --------------------------------------------------------- champs communs */

function ChampsProduit({
  categories,
  produit,
}: {
  categories: Categorie[];
  produit?: ProduitAvecStock;
}) {
  return (
    <>
      <div className="grid gap-5 sm:grid-cols-2">
        <label className="block">
          <span className="etiquette">Référence *</span>
          <input
            name="reference"
            defaultValue={produit?.reference}
            className="champ font-mono"
            placeholder="Ex. BP-GT70CA"
            required
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="etiquette">Nom *</span>
          <input
            name="nom"
            defaultValue={produit?.nom}
            className="champ"
            placeholder="Ex. Toner cyan"
            required
            autoComplete="off"
          />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-[1fr_1fr_8rem]">
        <label className="block">
          <span className="etiquette">Catégorie</span>
          <select name="categorie_id" defaultValue={produit?.categorie_id ?? ""} className="champ">
            <option value="">— Non classé —</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.nom}
              </option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="etiquette">Imprimantes compatibles</span>
          <input
            name="compatibilite"
            defaultValue={produit?.compatibilite ?? ""}
            className="champ"
            placeholder="Ex. BP-70C31, BP-70C36"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="etiquette">Seuil d&apos;alerte</span>
          <input
            name="seuil_alerte"
            type="number"
            inputMode="numeric"
            min={0}
            step={1}
            defaultValue={produit?.seuil_alerte ?? 1}
            className="champ font-mono"
          />
        </label>
      </div>

      <label className="block">
        <span className="etiquette">Description</span>
        <input
          name="description"
          defaultValue={produit?.description ?? ""}
          className="champ"
          placeholder="Optionnel"
          autoComplete="off"
        />
      </label>
    </>
  );
}

/* --------------------------------------------------------- création */

function BlocCreation({ categories, onFermer }: { categories: Categorie[]; onFermer: () => void }) {
  const [etat, action, enCours] = useActionState<EtatProduit, FormData>(creerProduitAction, {});
  useSuccesAction(etat);

  return (
    <Carte>
      <header className="mb-6 flex items-start justify-between gap-4 border-b border-hairline pb-5">
        <div>
          <h2 className="font-display text-[1.2rem] font-semibold tracking-[-0.03em]">Ajouter un produit</h2>
          <p className="mt-1 text-[0.85rem] text-ink-faint">
            La référence doit être unique. Le stock démarre à 0 : faites ensuite une entrée.
          </p>
        </div>
        <button type="button" onClick={onFermer} className={BOUTON_DISCRET}>
          Fermer
        </button>
      </header>

      <form key={etat.token ?? "vierge"} action={action} className="space-y-5">
        <ChampsProduit categories={categories} />
        {etat.erreur && <MessageErreur>{etat.erreur}</MessageErreur>}
        <div className="flex justify-end pt-1">
          <button
            type="submit"
            disabled={enCours}
            className="rounded-full bg-ink px-6 py-3 text-[0.9rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
          >
            {enCours ? "Création…" : "Créer le produit"}
          </button>
        </div>
      </form>
    </Carte>
  );
}

/* --------------------------------------------------------- carte produit */

const COULEUR_STATUT: Record<StatutStock, string> = {
  rupture: "text-rouille",
  bas: "text-amber",
  ok: "text-ink",
};

function CarteProduit({ produit, categories }: { produit: ProduitAvecStock; categories: Categorie[] }) {
  const [edition, setEdition] = useState(false);
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);
  const statut = statutStock(produit.quantite, produit.seuil_alerte);

  return (
    <article
      className={`rounded-[1.6rem] p-1.5 ring-1 transition-all duration-700 ease-mass ${
        produit.actif ? "bg-white/45 ring-white/60 hover:bg-white/70" : "bg-ink/3 ring-hairline"
      }`}
    >
      <div className="rounded-[1.225rem] bg-surface px-5 py-4 sm:px-6">
        {edition ? (
          <FormulaireEdition produit={produit} categories={categories} onFermer={() => setEdition(false)} />
        ) : (
          <>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="font-mono text-[0.85rem] tracking-[0.04em] text-brand">{produit.reference}</span>
                  {!produit.actif && (
                    <span className="rounded-full bg-ink/6 px-2 py-0.5 text-[0.82rem] font-medium text-ink-soft">
                      Désactivé
                    </span>
                  )}
                </div>
                <h3 className="mt-1 font-display text-[1.2rem] font-semibold tracking-[-0.03em]">{produit.nom}</h3>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-[0.82rem]">
                  <span
                    className={`rounded-full px-2.5 py-1 ${
                      produit.categorie_nom ? "bg-navy/7 text-navy" : "bg-ink/4 text-ink-faint"
                    }`}
                  >
                    {produit.categorie_nom ?? "Non classé"}
                  </span>
                  {produit.compatibilite && (
                    <span className="text-ink-soft">Pour {produit.compatibilite}</span>
                  )}
                  {produit.description && <span className="text-ink-faint">{produit.description}</span>}
                </div>
              </div>

              <div className="flex shrink-0 items-center gap-4">
                <div className="text-right">
                  <p className={`font-display text-[1.8rem] leading-none font-semibold tracking-[-0.04em] ${COULEUR_STATUT[statut]}`}>
                    {produit.quantite}
                  </p>
                  <p className="mt-1.5 text-[0.8rem] text-ink-faint">seuil {produit.seuil_alerte}</p>
                </div>
                <BadgeStatut statut={statut} />
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-1 border-t border-hairline pt-3">
              {produit.actif && (
                <>
                  <Link href={`/mouvements?nouveau=entree&produit=${produit.id}`} className={BOUTON_DISCRET}>
                    <span aria-hidden="true" className="text-jade">↑</span> Entrée
                  </Link>
                  {produit.quantite > 0 && (
                    <Link href={`/mouvements?nouveau=sortie&produit=${produit.id}`} className={BOUTON_DISCRET}>
                      <span aria-hidden="true" className="text-amber">↓</span> Sortie
                    </Link>
                  )}
                  <span aria-hidden="true" className="mx-1 h-4 w-px bg-hairline" />
                </>
              )}
              <button type="button" onClick={() => setEdition(true)} className={BOUTON_DISCRET}>
                Modifier
              </button>
              <form action={basculerActifProduitAction}>
                <input type="hidden" name="id" value={produit.id} />
                <input type="hidden" name="actif" value={produit.actif ? "0" : "1"} />
                <button type="submit" className={BOUTON_DISCRET}>
                  {produit.actif ? "Désactiver" : "Réactiver"}
                </button>
              </form>

              <div className="ml-auto">
                {confirmeSuppression ? (
                  <div className="flex items-center gap-2">
                    <span className="text-[0.85rem] text-ink-soft">Supprimer ?</span>
                    <form action={supprimerProduitAction}>
                      <input type="hidden" name="id" value={produit.id} />
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
          </>
        )}
      </div>
    </article>
  );
}

const BADGES: Record<StatutStock, { libelle: string; classe: string }> = {
  rupture: { libelle: "Rupture", classe: "bg-rouille/10 text-rouille" },
  bas: { libelle: "À commander", classe: "bg-amber/10 text-amber" },
  ok: { libelle: "OK", classe: "bg-jade/10 text-jade" },
};

function BadgeStatut({ statut }: { statut: StatutStock }) {
  const { libelle, classe } = BADGES[statut];
  return <span className={`rounded-full px-3 py-1.5 text-[0.8rem] font-medium ${classe}`}>{libelle}</span>;
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
  const [etat, action, enCours] = useActionState<EtatProduit, FormData>(modifierProduitAction, {});
  useSuccesAction(etat, onFermer);

  return (
    <form action={action} className="space-y-5">
      <input type="hidden" name="id" value={produit.id} />
      <ChampsProduit categories={categories} produit={produit} />
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
