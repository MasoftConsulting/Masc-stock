"use client";

import Link from "next/link";
import { useEffect } from "react";

export function BarreOutilsImpression({ retour, titre }: { retour: string; titre: string }) {
  // Lance automatiquement la fenêtre d'impression au chargement
  useEffect(() => {
    const t = setTimeout(() => window.print(), 500);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="sticky top-4 z-10 mx-auto mb-6 flex w-full max-w-3xl items-center gap-3 rounded-full bg-ink py-2 pr-2 pl-5 text-white shadow-flottant print:hidden">
      <Link href={retour} className="text-[0.82rem] text-white/70 hover:text-white transition-colors">
        ← Retour
      </Link>
      <span className="text-[0.85rem] font-medium">{titre}</span>
      <button
        type="button"
        onClick={() => window.print()}
        className="ml-auto flex items-center gap-2 rounded-full bg-white/12 py-1.5 pr-1.5 pl-4 text-[0.82rem] font-medium hover:bg-white/20 transition-all active:scale-[0.97]"
      >
        Imprimer
        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/15">
          <svg width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4.5 6V2.5h7V6M4.5 12H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v4a1 1 0 0 1-1 1h-1.5M4.5 10h7v3.5h-7z" />
          </svg>
        </span>
      </button>
    </div>
  );
}