"use client";

import { useActionState, useEffect, useMemo, useState } from "react";
import {
  creerEntreeAction,
  creerSortieAction,
  supprimerMouvementAction,
  type EtatMouvement,
} from "./actions";
import {
  symboleMouvement,
  type Client,
  type MouvementAvecDetails,
  type Produit,
  type TypeMouvement,
} from "@/lib/types-stock";
import { formaterDate } from "@/lib/format";

/* ------------------------------------------------------------ composant */

export function GestionMouvements({
  mouvements,
  produits,
  clients,
}: {
  mouvements: MouvementAvecDetails[];
  produits: Produit[];
  clients: Client[];
}) {
  const [ouvert, setOuvert] = useState<TypeMouvement | null>(null);

  return (
    <div className="space-y-6">
      <BarreActions
        ouvert={ouvert}
        setOuvert={setOuvert}
      />

      {ouvert === "entree" && (
        <FormulaireMouvement
          type="entree"
          produits={produits}
          clients={clients}
          onFermer={() => setOuvert(null)}
        />
      )}

      {ouvert === "sortie" && (
        <FormulaireMouvement
          type="sortie"
          produits={produits}
          clients={clients}
          onFermer={() => setOuvert(null)}
        />
      )}

      <FiltresListe mouvements={mouvements} />
    </div>
  );
}

/* ------------------------------------------------------------- boutons */

function BarreActions({
  ouvert,
  setOuvert,
}: {
  ouvert: TypeMouvement | null;
  setOuvert: (v: TypeMouvement | null) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      <BoutonAction
        actif={ouvert === "entree"}
        onClick={() => setOuvert(ouvert === "entree" ? null : "entree")}
        symbole="↑"
        label="Nouvelle entrée"
        description="Réception d'une livraison"
        ton="jade"
      />
      <BoutonAction
        actif={ouvert === "sortie"}
        onClick={() => setOuvert(ouvert === "sortie" ? null : "sortie")}
        symbole="↓"
        label="Nouvelle sortie"
        description="Livraison à un client"
        ton="amber"
      />
      <a
        href="/mouvements/inventaire"
        className="flex items-center gap-3 rounded-full bg-white/45 px-5 py-3 text-[0.85rem] font-medium text-ink ring-1 ring-white/60 shadow-flottant transition-all duration-500 ease-mass hover:bg-white/80"
      >
        <span className="grid h-8 w-8 place-items-center rounded-full bg-ink/[0.05]">
          ⚙
        </span>
        <span className="text-left">
          <span className="block text-[0.85rem]">Inventaire</span>
          <span className="block text-[0.7rem] text-ink-faint">
            Corriger après comptage
          </span>
        </span>
      </a>
    </div>
  );
}

function BoutonAction({
  actif,
  onClick,
  symbole,
  label,
  description,
  ton,
}: {
  actif: boolean;
  onClick: () => void;
  symbole: string;
  label: string;
  description: string;
  ton: "jade" | "amber";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-center gap-3 rounded-full px-5 py-3 text-[0.85rem] font-medium ring-1 shadow-flottant transition-all duration-500 ease-mass ${
        actif
          ? "bg-ink text-white ring-ink"
          : "bg-white/45 text-ink ring-white/60 hover:bg-white/80"
      }`}
    >
      <span
        className={`grid h-8 w-8 place-items-center rounded-full text-[1rem] ${
          actif
            ? "bg-white/15 text-white"
            : ton === "jade"
              ? "bg-jade/10 text-jade"
              : "bg-amber/10 text-amber"
        }`}
      >
        {symbole}
      </span>
      <span className="text-left">
        <span className="block">{label}</span>
        <span
          className={`block text-[0.7rem] ${
            actif ? "text-white/60" : "text-ink-faint"
          }`}
        >
          {description}
        </span>
      </span>
    </button>
  );
}

/* ---------------------------------------------------- formulaire entrée/sortie */

function FormulaireMouvement({
  type,
  produits,
  clients,
  onFermer,
}: {
  type: "entree" | "sortie";
  produits: Produit[];
  clients: Client[];
  onFermer: () => void;
}) {
  const [etat, action, enCours] = useActionState<EtatMouvement, FormData>(
    type === "entree" ? creerEntreeAction : creerSortieAction,
    {},
  );

  useEffect(() => {
    if (etat.token) onFermer();
  }, [etat.token, onFermer]);

  const aujourdhui = new Date().toISOString().slice(0, 10);

  return (
    <section className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
      <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
        <header className="mb-6 flex items-baseline gap-4 border-b border-hairline pb-5">
          <span
            className={`font-mono text-[0.7rem] ${
              type === "entree" ? "text-jade" : "text-amber"
            }`}
          >
            {type === "entree" ? "↑" : "↓"}
          </span>
          <div>
            <h2 className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
              {type === "entree" ? "Entrée en stock" : "Sortie de stock"}
            </h2>
            <p className="mt-1 text-[0.76rem] text-ink-faint">
              {type === "entree"
                ? "Réception d'une livraison fournisseur."
                : "Livraison d'un consommable à un client."}
            </p>
          </div>
        </header>

        <form action={action} className="space-y-5">
          <div className="grid gap-5 sm:grid-cols-3">
            <label className="block sm:col-span-2">
              <span className="etiquette">Produit *</span>
              <select
                name="produit_id"
                className="champ"
                required
                defaultValue=""
              >
                <option value="">— Choisir un produit —</option>
                {produits.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.reference} · {p.nom}
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="etiquette">Quantité *</span>
              <input
                name="quantite"
                type="number"
                min={1}
                step={1}
                required
                defaultValue={1}
                className="champ font-mono"
              />
            </label>
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="etiquette">Date *</span>
              <input
                name="date_mouvement"
                type="date"
                required
                defaultValue={aujourdhui}
                className="champ"
              />
            </label>

            {type === "entree" && (
              <label className="block">
                <span className="etiquette">Fournisseur</span>
                <input
                  name="fournisseur"
                  className="champ"
                  placeholder="Ex. Sharp Togo"
                  autoComplete="off"
                />
              </label>
            )}

            {type === "sortie" && (
              <label className="block">
                <span className="etiquette">Client *</span>
                <select
                  name="client_id"
                  className="champ"
                  required
                  defaultValue=""
                >
                  <option value="">— Choisir un client —</option>
                  {clients.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.nom}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>

          <label className="block">
            <span className="etiquette">Note</span>
            <input
              name="note"
              className="champ"
              placeholder="Optionnel — numéro de commande, précision…"
              autoComplete="off"
            />
          </label>

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
              {enCours
                ? "Enregistrement…"
                : type === "entree"
                  ? "Enregistrer l'entrée"
                  : "Enregistrer la sortie"}
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- liste */

function FiltresListe({
  mouvements,
}: {
  mouvements: MouvementAvecDetails[];
}) {
  const [typeFiltre, setTypeFiltre] = useState<"" | TypeMouvement>("");
  const [recherche, setRecherche] = useState("");

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return mouvements.filter((m) => {
      if (typeFiltre && m.type !== typeFiltre) return false;
      if (terme) {
        const match =
          m.produit_nom.toLowerCase().includes(terme) ||
          m.produit_reference.toLowerCase().includes(terme) ||
          (m.client_nom ?? "").toLowerCase().includes(terme) ||
          (m.fournisseur ?? "").toLowerCase().includes(terme) ||
          (m.note ?? "").toLowerCase().includes(terme);
        if (!match) return false;
      }
      return true;
    });
  }, [mouvements, typeFiltre, recherche]);

  const aFiltre = Boolean(typeFiltre || recherche);

  if (mouvements.length === 0) {
    return (
      <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
        <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-16 text-center">
          <p className="font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
            Aucun mouvement
          </p>
          <p className="mx-auto mt-3 max-w-md text-[0.9rem] leading-relaxed text-ink-soft">
            Enregistrez une entrée ou une sortie ci-dessus pour faire vivre le
            stock.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-[1.75rem] bg-white/50 p-1.5 ring-1 ring-white/70 shadow-flottant backdrop-blur-xl">
        <div className="grid gap-3 rounded-[calc(1.75rem-0.375rem)] bg-surface p-4 sm:grid-cols-[2fr_1fr]">
          <label className="block">
            <span className="etiquette">Rechercher</span>
            <input
              value={recherche}
              onChange={(e) => setRecherche(e.target.value)}
              className="champ"
              placeholder="Produit, client, fournisseur, note…"
              autoComplete="off"
            />
          </label>
          <label className="block">
            <span className="etiquette">Type</span>
            <select
              value={typeFiltre}
              onChange={(e) =>
                setTypeFiltre(e.target.value as "" | TypeMouvement)
              }
              className="champ"
            >
              <option value="">Tous</option>
              <option value="entree">Entrées</option>
              <option value="sortie">Sorties</option>
              <option value="ajustement">Ajustements</option>
            </select>
          </label>
        </div>
        {aFiltre && (
          <div className="flex items-center justify-between gap-2 px-4 pb-2 pt-3">
            <span className="text-[0.78rem] text-ink-soft">
              {filtres.length} sur {mouvements.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setRecherche("");
                setTypeFiltre("");
              }}
              className="text-[0.78rem] text-ink-soft underline underline-offset-4 transition-colors duration-500 ease-mass hover:text-ink"
            >
              Effacer les filtres
            </button>
          </div>
        )}
      </div>

      <section className="space-y-2">
        {filtres.length === 0 ? (
          <div className="rounded-[2rem] bg-white/50 p-2 ring-1 ring-white/70">
            <div className="rounded-[calc(2rem-0.5rem)] bg-surface px-8 py-12 text-center">
              <p className="font-display text-[1.15rem] font-semibold tracking-[-0.03em]">
                Aucun mouvement ne correspond
              </p>
              <p className="mx-auto mt-3 max-w-md text-[0.85rem] leading-relaxed text-ink-soft">
                Élargissez la recherche ou retirez les filtres.
              </p>
            </div>
          </div>
        ) : (
          filtres.map((m) => <LigneMouvement key={m.id} mouvement={m} />)
        )}
      </section>
    </>
  );
}

function LigneMouvement({ mouvement }: { mouvement: MouvementAvecDetails }) {
  const [confirmeSuppression, setConfirmeSuppression] = useState(false);
  const estAjustement = mouvement.type === "ajustement";

  return (
    <article className="rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60 transition-all duration-500 ease-mass hover:bg-white/70">
      <div className="rounded-[calc(1.6rem-0.375rem)] bg-surface px-5 py-4 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <span
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[1.05rem] ${
              mouvement.type === "entree"
                ? "bg-jade/10 text-jade"
                : mouvement.type === "sortie"
                  ? "bg-amber/10 text-amber"
                  : "bg-ink/[0.06] text-ink-soft"
            }`}
          >
            {symboleMouvement(mouvement.type)}
          </span>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-2.5">
              <span
                className={`font-display text-[1.15rem] font-semibold tracking-[-0.02em] ${
                  mouvement.type === "entree"
                    ? "text-jade"
                    : mouvement.type === "sortie"
                      ? "text-amber"
                      : "text-ink"
                }`}
              >
                {mouvement.type === "entree" ? "+" : mouvement.type === "sortie" ? "−" : "±"}
                {Math.abs(mouvement.quantite)}
              </span>
              <span className="font-mono text-[0.72rem] tracking-[0.06em] text-brand">
                {mouvement.produit_reference}
              </span>
            </div>
            <p className="mt-1 truncate text-[0.85rem] text-ink">
              {mouvement.produit_nom}
            </p>
            <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[0.75rem] text-ink-soft">
              <span>{formaterDate(mouvement.date_mouvement)}</span>
              {mouvement.client_nom && (
                <span>· Client : {mouvement.client_nom}</span>
              )}
              {mouvement.fournisseur && (
                <span>· Fournisseur : {mouvement.fournisseur}</span>
              )}
              {mouvement.note && <span>· {mouvement.note}</span>}
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-1">
            {estAjustement && (
              <>
                {confirmeSuppression ? (
                  <>
                    <span className="text-[0.72rem] text-ink-soft">
                      Confirmer ?
                    </span>
                    <form action={supprimerMouvementAction}>
                      <input type="hidden" name="id" value={mouvement.id} />
                      <button
                        type="submit"
                        className="rounded-full bg-rouille px-3 py-2 text-[0.72rem] font-medium text-white active:scale-[0.97]"
                      >
                        Oui
                      </button>
                    </form>
                    <button
                      type="button"
                      onClick={() => setConfirmeSuppression(false)}
                      className="rounded-full px-3 py-2 text-[0.72rem] text-ink-faint hover:text-ink"
                    >
                      Non
                    </button>
                  </>
                ) : (
                  <button
                    type="button"
                    onClick={() => setConfirmeSuppression(true)}
                    className="rounded-full px-3 py-2 text-[0.72rem] text-ink-faint transition-all duration-500 ease-mass hover:bg-rouille/10 hover:text-rouille"
                  >
                    Supprimer
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </article>
  );
}