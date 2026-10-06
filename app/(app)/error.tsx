"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * Erreur inattendue (base injoignable, configuration manquante…).
 *
 * En production, Next masque le message des erreurs serveur ; seul le
 * `digest` permet de retrouver l'erreur complète dans les logs du serveur.
 */
export default function PageErreur({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto w-full max-w-md pt-16">
      <div className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
        <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 text-center sm:p-8">
          <p className="font-display text-[1.4rem] font-semibold tracking-[-0.03em]">
            Données indisponibles
          </p>
          <p className="mx-auto mt-3 text-[0.88rem] leading-relaxed text-ink-soft">
            La page n&apos;a pas pu charger les données du stock. Rien n&apos;a
            été modifié. Réessayez dans un instant.
          </p>

          {process.env.NODE_ENV === "development" ? (
            <p className="mt-5 rounded-2xl bg-rouille/10 px-4 py-3 text-left font-mono text-[0.82rem] text-rouille">
              {error.message}
            </p>
          ) : (
            error.digest && (
              <p className="mt-5 font-mono text-[0.8rem] text-ink-faint">
                Référence : {error.digest}
              </p>
            )
          )}

          <div className="mt-6 flex items-center justify-center gap-2">
            <Link
              href="/"
              className="rounded-full px-4 py-2.5 text-[0.82rem] text-ink-soft transition-all duration-500 ease-mass hover:bg-ink/5 hover:text-ink"
            >
              Tableau de bord
            </Link>
            <button
              type="button"
              onClick={() => retry()}
              className="rounded-full bg-ink px-5 py-2.5 text-[0.82rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.97]"
            >
              Réessayer
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
