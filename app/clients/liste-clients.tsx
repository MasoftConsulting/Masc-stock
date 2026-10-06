"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { Carte, Vide } from "@/components/ui";
import { formaterDate, formaterNombre } from "@/lib/format";
import { parametresPeriode, type Periode } from "@/lib/periode";
import type { ClientAvecResume } from "@/lib/types-stock";

export function ListeClients({
  clients,
  periode,
}: {
  clients: ClientAvecResume[];
  periode: Periode;
}) {
  const [recherche, setRecherche] = useState("");
  const [livresSeulement, setLivresSeulement] = useState(true);

  const filtres = useMemo(() => {
    const terme = recherche.trim().toLowerCase();
    return clients
      .filter((c) => !livresSeulement || c.nb_livraisons > 0)
      .filter(
        (c) =>
          !terme ||
          c.nom.toLowerCase().includes(terme) ||
          (c.contact ?? "").toLowerCase().includes(terme),
      )
      .sort((a, b) => b.unites - a.unites || a.nom.localeCompare(b.nom, "fr"));
  }, [clients, recherche, livresSeulement]);

  const query = parametresPeriode(periode);

  return (
    <div className="space-y-4">
      <Carte interieur="grid gap-3 p-4 sm:grid-cols-[2fr_1fr] sm:items-end">
        <label className="block">
          <span className="etiquette">Rechercher</span>
          <input
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="champ"
            placeholder="Nom du client, contact…"
            autoComplete="off"
          />
        </label>
        <label className="flex items-center gap-2.5 pb-3 text-[0.82rem] text-ink-soft">
          <input
            type="checkbox"
            className="case"
            checked={livresSeulement}
            onChange={(e) => setLivresSeulement(e.target.checked)}
          />
          Livrés sur la période uniquement
        </label>
      </Carte>

      <p className="px-1 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-ink-faint">
        {filtres.length} client{filtres.length > 1 ? "s" : ""} · {periode.libelle}
      </p>

      {filtres.length === 0 ? (
        <Carte>
          <Vide>
            {livresSeulement
              ? "Aucun client livré sur cette période."
              : "Aucun client ne correspond à la recherche."}
          </Vide>
        </Carte>
      ) : (
        <ul className="space-y-2">
          {filtres.map((c) => (
            <li key={c.id}>
              <Link
                href={`/clients/${c.id}?${query}`}
                className="block rounded-[1.6rem] bg-white/45 p-1.5 ring-1 ring-white/60 transition-all duration-500 ease-mass hover:bg-white/80"
              >
                <div className="flex flex-wrap items-center gap-4 rounded-[1.225rem] bg-surface px-5 py-4 sm:px-6">
                  <div className="min-w-0 flex-1">
                    <p className="font-display text-[1.1rem] font-semibold tracking-[-0.02em]">
                      {c.nom}
                    </p>
                    <p className="mt-1 text-[0.75rem] text-ink-faint">
                      {[c.contact, c.telephone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>

                  {c.nb_livraisons > 0 ? (
                    <div className="flex items-center gap-6 text-right">
                      <div>
                        <p className="font-display text-[1.4rem] leading-none font-semibold">
                          {formaterNombre(c.unites)}
                        </p>
                        <p className="mt-1 text-[0.66rem] text-ink-faint">
                          unités · {c.nb_produits} réf.
                        </p>
                      </div>
                      <div className="hidden sm:block">
                        <p className="text-[0.82rem]">{formaterDate(c.derniere_livraison)}</p>
                        <p className="mt-1 text-[0.66rem] text-ink-faint">
                          {c.nb_livraisons} livraison{c.nb_livraisons > 1 ? "s" : ""}
                        </p>
                      </div>
                    </div>
                  ) : (
                    <span className="text-[0.75rem] text-ink-faint">
                      Aucune livraison
                    </span>
                  )}
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
