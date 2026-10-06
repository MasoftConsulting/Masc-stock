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
import { CELLULE, Carte, Grille, MessageErreur, Tableau, Tuile, Vide } from "@/components/ui";
import { BasculeVue, useVue } from "@/components/vue";
import { useSuccesAction } from "@/components/toasts";

type FiltreStatut = "" | "bas" | "rupture";

const BOUTON_DISCRET =
  "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[0.85rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink";

const COULEUR_STATUT: Record<StatutStock, string> = {
  rupture: "text-rouille",
  bas: "text-amber",
  ok: "text-ink",
};

const BADGES: Record<StatutStock, { libelle: string; classe: string }> = {
  rupture: { libelle: "Rupture", classe: "bg-rouille/10 text-rouille" },
  bas: { libelle: "À commander", classe: "bg-amber/10 text-amber" },
  ok: { libelle: "OK", classe: "bg-jade/10 text-jade" },
};

export function GestionProduits({
  produits,
  categories,
}: {
  produits: ProduitAvecStock[];
  categories: Categorie[];
}) {
  const [vue, setVue] = useVue("produits");
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
            + Ajouter un produit
          </button>
        )}
        {produits.length > 0 && <BasculeVue vue={vue} onChange={setVue} />}
      </div>

      {creation && <BlocCreation categories={categories} onFermer={() => setCreation(false)} />}

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
      ) : vue === "liste" ? (
        <Tableau
          colonnes={[
            { libelle: "Référence" },
            { libelle: "Produit" },
            { libelle: "Compatible", masquerMobile: true },
            { libelle: "Stock", droite: true },
            { libelle: "Statut", masquerMobile: true },
            { libelle: "", droite: true },
          ]}
        >
          {filtres.map((p) => (
            <LigneProduit key={p.id} produit={p} categories={categories} />
          ))}
        </Tableau>
      ) : (
        <Grille>
          {filtres.map((p) => (
            <TuileProduit key={p.id} produit={p} categories={categories} />
          ))}
        </Grille>
      )}
    </div>
  );
}

/* ------------------------------------------------------------ vue liste */

function LigneProduit({ produit: p, categories }: { produit: ProduitAvecStock; categories: Categorie[] }) {
  const [edition, setEdition] = useState(false);
  const statut = statutStock(p.quantite, p.seuil_alerte);

  return (
    <>
      <tr className={p.actif ? "hover:bg-ink/2" : "bg-ink/2 text-ink-faint"}>
        <td className={`${CELLULE} font-mono text-[0.85rem] whitespace-nowrap text-brand`}>{p.reference}</td>
        <td className={CELLULE}>
          <span className="font-medium">{p.nom}</span>
          {!p.actif && <span className="ml-2 text-[0.8rem]">(désactivé)</span>}
          <span className="block text-[0.8rem] text-ink-faint">{p.categorie_nom ?? "Non classé"}</span>
        </td>
        <td className={`${CELLULE} hidden text-[0.85rem] text-ink-soft sm:table-cell`}>
          {p.compatibilite ?? "—"}
        </td>
        <td className={`${CELLULE} text-right whitespace-nowrap`}>
          <span className={`font-display text-[1.15rem] font-semibold ${COULEUR_STATUT[statut]}`}>{p.quantite}</span>
          <span className="ml-1 text-[0.8rem] text-ink-faint">/ {p.seuil_alerte}</span>
        </td>
        <td className={`${CELLULE} hidden sm:table-cell`}>
          <BadgeStatut statut={statut} />
        </td>
        <td className={`${CELLULE} text-right whitespace-nowrap`}>
          <ActionsRapides produit={p} onModifier={() => setEdition((v) => !v)} edition={edition} />
        </td>
      </tr>
      {edition && (
        <tr>
          <td colSpan={6} className="bg-ink/2 px-4 py-5 sm:px-6">
            <PanneauEdition produit={p} categories={categories} onFermer={() => setEdition(false)} />
          </td>
        </tr>
      )}
    </>
  );
}

/* ------------------------------------------------------------ vue grille */

function TuileProduit({ produit: p, categories }: { produit: ProduitAvecStock; categories: Categorie[] }) {
  const [edition, setEdition] = useState(false);
  const statut = statutStock(p.quantite, p.seuil_alerte);

  if (edition) {
    return (
      <Tuile large>
        <PanneauEdition produit={p} categories={categories} onFermer={() => setEdition(false)} />
      </Tuile>
    );
  }

  return (
    <Tuile attenue={!p.actif}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-mono text-[0.85rem] text-brand">{p.reference}</p>
          <h3 className="mt-0.5 truncate font-display text-[1.05rem] font-semibold tracking-[-0.02em]">{p.nom}</h3>
          <p className="truncate text-[0.8rem] text-ink-faint">
            {p.categorie_nom ?? "Non classé"}
            {p.compatibilite && ` · ${p.compatibilite}`}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className={`font-display text-[1.6rem] leading-none font-semibold ${COULEUR_STATUT[statut]}`}>
            {p.quantite}
          </p>
          <p className="mt-1 text-[0.75rem] text-ink-faint">seuil {p.seuil_alerte}</p>
        </div>
      </div>
      <div className="mt-auto pt-3">
        <div className="flex items-center justify-between gap-2 border-t border-hairline pt-2.5">
          {p.actif ? <BadgeStatut statut={statut} /> : <span className="text-[0.8rem] text-ink-faint">Désactivé</span>}
          <ActionsRapides produit={p} onModifier={() => setEdition(true)} edition={false} />
        </div>
      </div>
    </Tuile>
  );
}

/* ------------------------------------------------------- actions partagées */

function ActionsRapides({
  produit: p,
  onModifier,
  edition,
}: {
  produit: ProduitAvecStock;
  onModifier: () => void;
  edition: boolean;
}) {
  return (
    <span className="inline-flex items-center">
      {p.actif && (
        <>
          <Link
            href={`/mouvements?nouveau=entree&produit=${p.id}`}
            className={BOUTON_DISCRET}
            title="Enregistrer une entrée"
            aria-label={`Entrée pour ${p.reference}`}
          >
            <span aria-hidden="true" className="text-jade">↑</span>
            <span className="hidden lg:inline">Entrée</span>
          </Link>
          {p.quantite > 0 && (
            <Link
              href={`/mouvements?nouveau=sortie&produit=${p.id}`}
              className={BOUTON_DISCRET}
              title="Enregistrer une sortie"
              aria-label={`Sortie pour ${p.reference}`}
            >
              <span aria-hidden="true" className="text-amber">↓</span>
              <span className="hidden lg:inline">Sortie</span>
            </Link>
          )}
        </>
      )}
      <button type="button" onClick={onModifier} aria-expanded={edition} className={BOUTON_DISCRET}>
        {edition ? "Fermer" : "Modifier"}
      </button>
    </span>
  );
}

function BadgeStatut({ statut }: { statut: StatutStock }) {
  const { libelle, classe } = BADGES[statut];
  return (
    <span className={`inline-block rounded-full px-2.5 py-1 text-[0.78rem] font-medium whitespace-nowrap ${classe}`}>
      {libelle}
    </span>
  );
}

/* --------------------------------------------------------- champs communs */

function ChampsProduit({ categories, produit }: { categories: Categorie[]; produit?: ProduitAvecStock }) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
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

      <div className="grid gap-4 sm:grid-cols-[1fr_1fr_8rem]">
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

      <form key={etat.token ?? "vierge"} action={action} className="space-y-4">
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

/* ---------------------------------------------- édition (liste et grille) */

function PanneauEdition({
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
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);

  return (
    <div className="space-y-4">
      <p className="text-[0.85rem] font-medium text-ink-soft">
        Modifier <span className="font-mono text-brand">{produit.reference}</span>
      </p>
      <form action={action} className="space-y-4">
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

      <div className="flex flex-wrap items-center gap-2 border-t border-hairline pt-3">
        <form action={basculerActifProduitAction}>
          <input type="hidden" name="id" value={produit.id} />
          <input type="hidden" name="actif" value={produit.actif ? "0" : "1"} />
          <button type="submit" className={BOUTON_DISCRET}>
            {produit.actif ? "Désactiver le produit" : "Réactiver le produit"}
          </button>
        </form>
        {confirmeSuppression ? (
          <span className="inline-flex items-center gap-2">
            <span className="text-[0.85rem] text-ink-soft">Supprimer définitivement ?</span>
            <form action={supprimerProduitAction}>
              <input type="hidden" name="id" value={produit.id} />
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
