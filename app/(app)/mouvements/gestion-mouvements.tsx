"use client";

import Link from "next/link";
import { useActionState, useMemo, useState } from "react";
import {
  annulerMouvementAction,
  creerEntreeAction,
  creerSortieAction,
  type EtatMouvement,
} from "./actions";
import {
  formaterDelta,
  natureMouvement,
  type Client,
  type MouvementAvecDetails,
  type ProduitAvecStock,
  type TypeMouvement,
} from "@/lib/types-stock";
import { correspond, formaterDate, normaliser } from "@/lib/format";
import { Carte, MessageErreur, Vide } from "@/components/ui";
import { useSuccesAction } from "@/components/toasts";

type Saisie = "entree" | "sortie";

const TONS = {
  jade: { pastille: "bg-jade/10 text-jade", texte: "text-jade" },
  amber: { pastille: "bg-amber/10 text-amber", texte: "text-amber" },
  neutre: { pastille: "bg-ink/6 text-ink-soft", texte: "text-ink" },
};

/* ------------------------------------------------------------ composant */

export function GestionMouvements({
  mouvements,
  produits,
  clients,
  initial,
}: {
  mouvements: MouvementAvecDetails[];
  produits: ProduitAvecStock[];
  clients: Client[];
  /** Ouverture directe d'un formulaire (actions rapides). */
  initial?: { type: Saisie; produitId?: string };
}) {
  const [ouvert, setOuvert] = useState<Saisie | null>(initial?.type ?? null);
  const actifs = useMemo(
    () =>
      produits
        .filter((p) => p.actif)
        .sort((a, b) => a.reference.localeCompare(b.reference, "fr")),
    [produits],
  );

  return (
    <div className="space-y-6">
      <BarreActions ouvert={ouvert} setOuvert={setOuvert} />

      {ouvert && (
        <FormulaireMouvement
          key={ouvert}
          type={ouvert}
          produits={actifs}
          clients={clients}
          produitInitial={ouvert === initial?.type ? initial.produitId : undefined}
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
  ouvert: Saisie | null;
  setOuvert: (v: Saisie | null) => void;
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
      <Link
        href="/mouvements/inventaire"
        className="flex items-center gap-3 rounded-full bg-white/45 px-5 py-3 text-[0.9rem] font-medium text-ink ring-1 shadow-flottant ring-white/60 transition-all duration-500 ease-mass hover:bg-white/80"
      >
        <span aria-hidden="true" className="grid h-8 w-8 place-items-center rounded-full bg-ink/5">
          ⚙
        </span>
        <span className="text-left">
          <span className="block">Inventaire</span>
          <span className="block text-[0.82rem] text-ink-faint">Corriger après comptage</span>
        </span>
      </Link>
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
      aria-expanded={actif}
      className={`flex items-center gap-3 rounded-full px-5 py-3 text-[0.9rem] font-medium ring-1 shadow-flottant transition-all duration-500 ease-mass ${
        actif ? "bg-ink text-white ring-ink" : "bg-white/45 text-ink ring-white/60 hover:bg-white/80"
      }`}
    >
      <span
        aria-hidden="true"
        className={`grid h-8 w-8 place-items-center rounded-full text-[1rem] ${
          actif ? "bg-white/15 text-white" : TONS[ton].pastille
        }`}
      >
        {symbole}
      </span>
      <span className="text-left">
        <span className="block">{label}</span>
        <span className={`block text-[0.82rem] ${actif ? "text-white/70" : "text-ink-faint"}`}>
          {description}
        </span>
      </span>
    </button>
  );
}

/* ---------------------------------------------------- formulaire entrée/sortie */

function libelleProduit(p: ProduitAvecStock): string {
  return [p.reference, p.nom, p.compatibilite && `(${p.compatibilite})`].filter(Boolean).join(" · ");
}

function FormulaireMouvement({
  type,
  produits,
  clients,
  produitInitial,
  onFermer,
}: {
  type: Saisie;
  produits: ProduitAvecStock[];
  clients: Client[];
  produitInitial?: string;
  onFermer: () => void;
}) {
  const [etat, action, enCours] = useActionState<EtatMouvement, FormData>(
    type === "entree" ? creerEntreeAction : creerSortieAction,
    {},
  );
  useSuccesAction(etat, onFermer);

  const sortie = type === "sortie";
  const [produitId, setProduitId] = useState(
    produits.some((p) => p.id === produitInitial) ? produitInitial! : "",
  );
  const produit = produits.find((p) => p.id === produitId);
  const disponible = produit?.quantite ?? 0;
  const aujourdhui = new Date().toISOString().slice(0, 10);

  return (
    <Carte>
      <header className="mb-6 flex items-baseline gap-4 border-b border-hairline pb-5">
        <span aria-hidden="true" className={`font-mono text-[0.9rem] ${sortie ? "text-amber" : "text-jade"}`}>
          {sortie ? "↓" : "↑"}
        </span>
        <div>
          <h2 className="font-display text-[1.2rem] font-semibold tracking-[-0.03em]">
            {sortie ? "Sortie de stock" : "Entrée en stock"}
          </h2>
          <p className="mt-1 text-[0.85rem] text-ink-faint">
            {sortie
              ? "Livraison d'un consommable à un client."
              : "Réception d'une livraison fournisseur."}
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
              value={produitId}
              onChange={(e) => setProduitId(e.target.value)}
            >
              <option value="">— Choisir un produit —</option>
              {produits.map((p) => (
                <option key={p.id} value={p.id} disabled={sortie && p.quantite === 0}>
                  {libelleProduit(p)} — {p.quantite} en stock
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="etiquette">Quantité *</span>
            <input
              name="quantite"
              type="number"
              inputMode="numeric"
              min={1}
              max={sortie && produit ? disponible : undefined}
              step={1}
              required
              defaultValue={1}
              className="champ font-mono"
            />
            {produit && (
              <span
                className={`mt-1.5 block text-[0.8rem] ${
                  sortie && disponible <= produit.seuil_alerte ? "text-amber" : "text-ink-faint"
                }`}
              >
                {disponible} en stock
                {sortie && ` · ${disponible} au maximum`}
              </span>
            )}
          </label>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block">
            <span className="etiquette">Date *</span>
            <input
              name="date_mouvement"
              type="date"
              required
              max={aujourdhui}
              defaultValue={aujourdhui}
              className="champ"
            />
          </label>

          {sortie ? (
            <label className="block">
              <span className="etiquette">Client *</span>
              <select name="client_id" className="champ" required defaultValue="">
                <option value="">— Choisir un client —</option>
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.nom}
                  </option>
                ))}
              </select>
            </label>
          ) : (
            <label className="block">
              <span className="etiquette">Fournisseur</span>
              <input name="fournisseur" className="champ" placeholder="Ex. Sharp Togo" autoComplete="off" />
            </label>
          )}
        </div>

        <label className="block">
          <span className="etiquette">Note</span>
          <input
            name="note"
            className="champ"
            placeholder="Optionnel — n° de bon de livraison, précision…"
            autoComplete="off"
          />
        </label>

        {etat.erreur && <MessageErreur>{etat.erreur}</MessageErreur>}

        <div className="flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onFermer}
            className="rounded-full px-4 py-2.5 text-[0.9rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
          >
            Fermer
          </button>
          <button
            type="submit"
            disabled={enCours || (sortie && produit !== undefined && disponible === 0)}
            className="rounded-full bg-ink px-5 py-2.5 text-[0.9rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.97] disabled:opacity-60"
          >
            {enCours ? "Enregistrement…" : sortie ? "Enregistrer la sortie" : "Enregistrer l'entrée"}
          </button>
        </div>
      </form>
    </Carte>
  );
}

/* ------------------------------------------------------------- liste */

function FiltresListe({ mouvements }: { mouvements: MouvementAvecDetails[] }) {
  const [typeFiltre, setTypeFiltre] = useState<"" | TypeMouvement>("");
  const [recherche, setRecherche] = useState("");

  const filtres = useMemo(() => {
    const terme = normaliser(recherche);
    return mouvements.filter(
      (m) =>
        (!typeFiltre || m.type === typeFiltre) &&
        correspond(terme, m.produit_nom, m.produit_reference, m.client_nom, m.fournisseur, m.note),
    );
  }, [mouvements, typeFiltre, recherche]);

  if (mouvements.length === 0) {
    return (
      <Carte>
        <Vide>Aucun mouvement. Enregistrez une entrée ou une sortie ci-dessus.</Vide>
      </Carte>
    );
  }

  const aFiltre = Boolean(typeFiltre || recherche);

  return (
    <>
      <Carte interieur="grid gap-3 p-4 sm:grid-cols-[2fr_1fr]">
        <label className="block">
          <span className="etiquette">Rechercher</span>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="champ"
            placeholder="Référence, produit, client, fournisseur, note…"
            autoComplete="off"
          />
        </label>
        <label className="block">
          <span className="etiquette">Type</span>
          <select
            value={typeFiltre}
            onChange={(e) => setTypeFiltre(e.target.value as "" | TypeMouvement)}
            className="champ"
          >
            <option value="">Tous</option>
            <option value="entree">Entrées</option>
            <option value="sortie">Sorties</option>
            <option value="ajustement">Ajustements et annulations</option>
          </select>
        </label>
        {aFiltre && (
          <div className="flex items-center justify-between gap-2 sm:col-span-2">
            <span className="text-[0.85rem] text-ink-soft">
              {filtres.length} sur {mouvements.length}
            </span>
            <button
              type="button"
              onClick={() => {
                setRecherche("");
                setTypeFiltre("");
              }}
              className="text-[0.85rem] text-ink-soft underline underline-offset-4 hover:text-ink"
            >
              Effacer les filtres
            </button>
          </div>
        )}
      </Carte>

      <section className="space-y-2">
        {filtres.length === 0 ? (
          <Carte>
            <Vide>Aucun mouvement ne correspond. Élargissez la recherche.</Vide>
          </Carte>
        ) : (
          filtres.map((m) => <LigneMouvement key={m.id} mouvement={m} />)
        )}
      </section>
    </>
  );
}

function LigneMouvement({ mouvement: m }: { mouvement: MouvementAvecDetails }) {
  const [annulation, setAnnulation] = useState(false);
  const nature = natureMouvement(m);
  const annule = m.annule_par !== null;
  const annulable = !annule && m.annulation_de === null;

  return (
    <article
      className={`rounded-[1.6rem] p-1.5 ring-1 transition-all duration-500 ease-mass ${
        annule ? "bg-ink/3 ring-hairline" : "bg-white/45 ring-white/60 hover:bg-white/70"
      }`}
    >
      <div className="rounded-[1.225rem] bg-surface px-5 py-4 sm:px-6">
        <div className="flex flex-wrap items-center gap-4">
          <span
            aria-hidden="true"
            className={`grid h-10 w-10 shrink-0 place-items-center rounded-full text-[1.05rem] ${TONS[nature.ton].pastille}`}
          >
            {nature.symbole}
          </span>

          <div className={`min-w-0 flex-1 ${annule ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-1">
              <span
                className={`font-display text-[1.2rem] font-semibold tracking-[-0.02em] ${
                  annule ? "line-through" : TONS[nature.ton].texte
                }`}
              >
                {formaterDelta(nature.delta)}
              </span>
              <span className="text-[0.8rem] font-medium uppercase tracking-[0.08em] text-ink-soft">
                {nature.libelle}
              </span>
              <span className="font-mono text-[0.8rem] tracking-[0.04em] text-brand">
                {m.produit_reference}
              </span>
              {annule && (
                <span className="rounded-full bg-rouille/10 px-2 py-0.5 text-[0.82rem] font-medium text-rouille">
                  Annulé
                </span>
              )}
            </div>
            <p className="mt-1 truncate text-[0.9rem] text-ink">{m.produit_nom}</p>
            <p className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-[0.82rem] text-ink-soft">
              <span>{formaterDate(m.date_mouvement)}</span>
              {m.client_nom && <span>· {m.client_nom}</span>}
              {m.fournisseur && <span>· {m.fournisseur}</span>}
              {m.note && <span>· {m.note}</span>}
            </p>
          </div>

          {annulable && !annulation && (
            <button
              type="button"
              onClick={() => setAnnulation(true)}
              className="shrink-0 rounded-full px-3.5 py-2 text-[0.85rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-rouille/10 hover:text-rouille"
            >
              Annuler…
            </button>
          )}
        </div>

        {annulation && <FormulaireAnnulation mouvement={m} onFermer={() => setAnnulation(false)} />}
      </div>
    </article>
  );
}

function FormulaireAnnulation({
  mouvement,
  onFermer,
}: {
  mouvement: MouvementAvecDetails;
  onFermer: () => void;
}) {
  const [etat, action, enCours] = useActionState<EtatMouvement, FormData>(annulerMouvementAction, {});
  useSuccesAction(etat, onFermer);

  return (
    <form action={action} className="mt-4 space-y-3 border-t border-hairline pt-4">
      <input type="hidden" name="id" value={mouvement.id} />
      <p className="text-[0.88rem] text-ink-soft">
        Un ajustement inverse sera créé et ce mouvement apparaîtra barré. Le
        stock est rétabli ; l&apos;historique garde la trace de l&apos;erreur.
      </p>
      <label className="block">
        <span className="etiquette">Motif *</span>
        <input
          name="motif"
          required
          autoFocus
          autoComplete="off"
          className="champ"
          placeholder="Ex. mauvaise quantité, mauvais client…"
        />
      </label>
      {etat.erreur && <MessageErreur>{etat.erreur}</MessageErreur>}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={onFermer}
          className="rounded-full px-4 py-2.5 text-[0.9rem] text-ink-soft hover:bg-ink/5 hover:text-ink"
        >
          Garder
        </button>
        <button
          type="submit"
          disabled={enCours}
          className="rounded-full bg-rouille px-5 py-2.5 text-[0.9rem] font-medium text-white active:scale-[0.97] disabled:opacity-60"
        >
          {enCours ? "Annulation…" : "Annuler le mouvement"}
        </button>
      </div>
    </form>
  );
}
