"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { connexion, type EtatFormulaire } from "@/app/actions";

function BoutonEntrer() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="group flex w-full items-center justify-between gap-3 rounded-full bg-ink py-2 pr-2 pl-6 text-[0.95rem] font-medium text-white shadow-flottant transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-60"
    >
      <span>{pending ? "Connexion…" : "Entrer"}</span>
      <span className="grid h-9 w-9 place-items-center rounded-full bg-white/12 transition-all duration-500 ease-mass group-hover:translate-x-1 group-hover:-translate-y-[1px] group-hover:scale-105">
        <svg
          width="15"
          height="15"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M3 8h10M9 4l4 4-4 4" />
        </svg>
      </span>
    </button>
  );
}

export function Formulaire() {
  const [etat, action] = useActionState<EtatFormulaire, FormData>(connexion, {});

  return (
    <div className="rounded-[2rem] bg-white/45 p-1.5 ring-1 ring-white/60 shadow-flottant">
      <div className="rounded-[calc(2rem-0.375rem)] bg-surface p-6 shadow-[inset_0_1px_1px_rgba(255,255,255,0.9)] sm:p-8">
        <form action={action} className="space-y-5">
          <label className="block">
            <span className="etiquette">Code d&apos;accès</span>
            <input
              name="code"
              type="password"
              autoComplete="off"
              autoFocus
              required
              className="champ font-mono tracking-[0.15em]"
              placeholder="••••••••"
            />
          </label>

          {etat.erreur && (
            <p className="rounded-2xl bg-rouille/10 px-4 py-3 text-[0.85rem] text-rouille">
              {etat.erreur}
            </p>
          )}

          <BoutonEntrer />
        </form>
      </div>
    </div>
  );
}