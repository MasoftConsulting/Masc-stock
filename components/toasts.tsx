"use client";

import { useEffect, useRef, useSyncExternalStore } from "react";

/**
 * Confirmations éphémères (« Sortie enregistrée »).
 *
 * Mini-store au niveau du module : n'importe quel composant client appelle
 * `annoncer()`, le composant <Toasts /> (monté une fois dans le layout)
 * affiche. Pas de contexte React à faire traverser l'arbre.
 */

type Toast = { id: number; message: string; ton: "succes" | "erreur" };

let toasts: Toast[] = [];
let prochainId = 1;
const abonnes = new Set<() => void>();

function publier(suivants: Toast[]) {
  toasts = suivants;
  abonnes.forEach((f) => f());
}

export function annoncer(message: string, ton: Toast["ton"] = "succes") {
  const toast = { id: prochainId++, message, ton };
  publier([...toasts, toast]);
  window.setTimeout(() => publier(toasts.filter((t) => t.id !== toast.id)), 4000);
}

function abonner(f: () => void) {
  abonnes.add(f);
  return () => abonnes.delete(f);
}

/**
 * À appeler dans un formulaire `useActionState` : à chaque nouveau succès
 * (nouveau `token`), affiche le message et exécute `apres` (fermer le
 * formulaire…).
 */
export function useSuccesAction(
  etat: { token?: string; message?: string },
  apres?: () => void,
) {
  const dernier = useRef(etat.token);
  const rappel = useRef(apres);
  useEffect(() => {
    rappel.current = apres;
  });

  useEffect(() => {
    if (!etat.token || etat.token === dernier.current) return;
    dernier.current = etat.token;
    if (etat.message) annoncer(etat.message);
    rappel.current?.();
  }, [etat.token, etat.message]);
}

const AUCUN: Toast[] = [];

export function Toasts() {
  const liste = useSyncExternalStore(abonner, () => toasts, () => AUCUN);

  return (
    <div
      aria-live="polite"
      className="pointer-events-none fixed inset-x-0 bottom-5 z-50 flex flex-col items-center gap-2 px-4"
    >
      {liste.map((t) => (
        <p
          key={t.id}
          role="status"
          className={`toast pointer-events-auto flex items-center gap-2.5 rounded-full px-5 py-3 text-[0.9rem] font-medium text-white shadow-flottant ${
            t.ton === "succes" ? "bg-ink" : "bg-rouille"
          }`}
        >
          <span aria-hidden="true">{t.ton === "succes" ? "✓" : "!"}</span>
          {t.message}
        </p>
      ))}
    </div>
  );
}
