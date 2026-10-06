"use client";

import { useSyncExternalStore } from "react";

/**
 * Choix d'affichage Grille / Liste, mémorisé par page dans le navigateur.
 *
 * Préférence purement locale : `localStorage` suffit (avec repli en mémoire
 * si le stockage est bloqué). Côté serveur, on rend la vue par défaut ;
 * `useSyncExternalStore` bascule sur la préférence enregistrée à l'hydratation.
 */

export type Vue = "grille" | "liste";

const EVENEMENT = "masc-vue";
const memoire = new Map<string, Vue>();

function lire(cle: string, defaut: Vue): Vue {
  const enMemoire = memoire.get(cle);
  if (enMemoire) return enMemoire;
  try {
    const v = window.localStorage.getItem(`vue:${cle}`);
    return v === "grille" || v === "liste" ? v : defaut;
  } catch {
    return defaut;
  }
}

function abonner(rappel: () => void) {
  window.addEventListener(EVENEMENT, rappel);
  window.addEventListener("storage", rappel);
  return () => {
    window.removeEventListener(EVENEMENT, rappel);
    window.removeEventListener("storage", rappel);
  };
}

export function useVue(cle: string, defaut: Vue = "liste"): [Vue, (vue: Vue) => void] {
  const vue = useSyncExternalStore(
    abonner,
    () => lire(cle, defaut),
    () => defaut,
  );

  const changer = (suivante: Vue) => {
    memoire.set(cle, suivante);
    try {
      window.localStorage.setItem(`vue:${cle}`, suivante);
    } catch {
      // Stockage bloqué (navigation privée…) : la mémoire suffit pour la session.
    }
    window.dispatchEvent(new Event(EVENEMENT));
  };

  return [vue, changer];
}

function IconeGrille() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <rect x="2" y="2" width="5" height="5" rx="1.2" />
      <rect x="9" y="2" width="5" height="5" rx="1.2" />
      <rect x="2" y="9" width="5" height="5" rx="1.2" />
      <rect x="9" y="9" width="5" height="5" rx="1.2" />
    </svg>
  );
}

function IconeListe() {
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" aria-hidden="true">
      <path d="M2.5 4h11M2.5 8h11M2.5 12h11" />
    </svg>
  );
}

/** Interrupteur Grille / Liste. */
export function BasculeVue({ vue, onChange }: { vue: Vue; onChange: (vue: Vue) => void }) {
  const options: { valeur: Vue; libelle: string; icone: React.ReactNode }[] = [
    { valeur: "liste", libelle: "Liste", icone: <IconeListe /> },
    { valeur: "grille", libelle: "Grille", icone: <IconeGrille /> },
  ];

  return (
    <div role="group" aria-label="Affichage" className="inline-flex rounded-full bg-white/60 p-1 ring-1 ring-white/70">
      {options.map((o) => (
        <button
          key={o.valeur}
          type="button"
          aria-pressed={vue === o.valeur}
          onClick={() => onChange(o.valeur)}
          className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-[0.85rem] font-medium transition-all duration-500 ease-mass ${
            vue === o.valeur ? "bg-ink text-white" : "text-ink-soft hover:bg-ink/5 hover:text-ink"
          }`}
        >
          {o.icone}
          {o.libelle}
        </button>
      ))}
    </div>
  );
}
