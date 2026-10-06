import Link from "next/link";
import { PERIODES, type CodePeriode, type Periode } from "@/lib/periode";

/**
 * Choix de la période, entièrement dans l'URL : la vue se partage par lien et
 * survit au rafraîchissement. Raccourcis = liens ; dates libres = formulaire
 * GET (aucun JavaScript nécessaire).
 */
export function SelecteurPeriode({
  chemin,
  periode,
}: {
  chemin: string;
  periode: Periode;
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <nav className="flex flex-wrap gap-1 rounded-full bg-white/50 p-1 ring-1 ring-white/70">
        {(Object.keys(PERIODES) as CodePeriode[]).map((code) => (
          <Link
            key={code}
            href={`${chemin}?periode=${code}`}
            className={`rounded-full px-3.5 py-1.5 text-[0.78rem] font-medium transition-all duration-500 ease-mass ${
              periode.code === code
                ? "bg-ink text-white"
                : "text-ink-soft hover:bg-ink/5 hover:text-ink"
            }`}
          >
            {PERIODES[code]}
          </Link>
        ))}
      </nav>

      <form action={chemin} className="flex flex-wrap items-end gap-2">
        <label>
          <span className="etiquette">Du</span>
          <input
            type="date"
            name="du"
            defaultValue={periode.du ?? ""}
            className="champ py-1.5 text-[0.82rem]"
          />
        </label>
        <label>
          <span className="etiquette">Au</span>
          <input
            type="date"
            name="au"
            defaultValue={periode.au ?? ""}
            className="champ py-1.5 text-[0.82rem]"
          />
        </label>
        <button
          type="submit"
          className={`rounded-full px-4 py-2 text-[0.78rem] font-medium transition-all duration-500 ease-mass ${
            periode.code === "personnalisee"
              ? "bg-ink text-white"
              : "bg-ink/5 text-ink hover:bg-ink/10"
          }`}
        >
          Appliquer
        </button>
      </form>
    </div>
  );
}
