"use client";

import { useFormStatus } from "react-dom";
import { supprimerBLAction } from "./actions";

function BoutonSubmit() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full px-3 py-1.5 text-[0.8rem] text-rouille hover:bg-rouille/10 transition-colors disabled:opacity-50"
    >
      {pending ? "Suppression…" : "Supprimer"}
    </button>
  );
}

export function BoutonSupprimerBL({ id }: { id: string }) {
  return (
    <form
      action={supprimerBLAction}
      onSubmit={(e) => {
        if (!window.confirm("Supprimer ce bon de livraison ? Le stock sera remis à jour automatiquement.")) {
          e.preventDefault(); // Annule la soumission si on clique sur "Annuler"
        }
      }}
    >
      <input type="hidden" name="id" value={id} />
      <BoutonSubmit />
    </form>
  );
}