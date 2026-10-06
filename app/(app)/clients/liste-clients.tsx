"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { CELLULE, Carte, Grille, Tableau, Tuile, Vide } from "@/components/ui";
import { BasculeVue, useVue } from "@/components/vue";
import { correspond, formaterDate, formaterNombre, normaliser } from "@/lib/format";
import { parametresPeriode, type Periode } from "@/lib/periode";
import type { ClientAvecResume } from "@/lib/types-stock";

export function ListeClients({
  clients,
  periode,
}: {
  clients: ClientAvecResume[];
  periode: Periode;
}) {
  const [vue, setVue] = useVue("clients");
  const [recherche, setRecherche] = useState("");
  const [livresSeulement, setLivresSeulement] = useState(true);

  const filtres = useMemo(() => {
    const terme = normaliser(recherche);
    return clients
      .filter((c) => !livresSeulement || c.nb_livraisons > 0)
      .filter((c) => correspond(terme, c.nom, c.contact, c.telephone))
      .sort((a, b) => b.unites - a.unites || a.nom.localeCompare(b.nom, "fr"));
  }, [clients, recherche, livresSeulement]);

  const lien = (id: string) => `/clients/${id}?${parametresPeriode(periode)}`;

  return (
    <div className="space-y-4">
      <Carte interieur="grid gap-3 p-4 sm:grid-cols-[2fr_1fr] sm:items-end">
        <label className="block">
          <span className="etiquette">Rechercher</span>
          <input
            type="search"
            value={recherche}
            onChange={(e) => setRecherche(e.target.value)}
            className="champ"
            placeholder="Nom du client, contact…"
            autoComplete="off"
          />
        </label>
        <label className="flex items-center gap-2.5 pb-3 text-[0.88rem] text-ink-soft">
          <input
            type="checkbox"
            className="case"
            checked={livresSeulement}
            onChange={(e) => setLivresSeulement(e.target.checked)}
          />
          Livrés sur la période uniquement
        </label>
      </Carte>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="px-1 text-[0.85rem] text-ink-soft">
          {filtres.length} client{filtres.length > 1 ? "s" : ""} · {periode.libelle}
        </p>
        <BasculeVue vue={vue} onChange={setVue} />
      </div>

      {filtres.length === 0 ? (
        <Carte>
          <Vide>
            {livresSeulement
              ? "Aucun client livré sur cette période."
              : "Aucun client ne correspond à la recherche."}
          </Vide>
        </Carte>
      ) : vue === "liste" ? (
        <Tableau
          colonnes={[
            { libelle: "Client" },
            { libelle: "Contact", masquerMobile: true },
            { libelle: "Unités", droite: true },
            { libelle: "Réf.", droite: true, masquerMobile: true },
            { libelle: "Livraisons", droite: true, masquerMobile: true },
            { libelle: "Dernière", droite: true },
          ]}
        >
          {filtres.map((c) => (
            <tr key={c.id} className="hover:bg-ink/2">
              <td className={CELLULE}>
                <Link href={lien(c.id)} className="font-medium text-ink hover:text-navy hover:underline">
                  {c.nom}
                </Link>
              </td>
              <td className={`${CELLULE} hidden text-[0.85rem] text-ink-soft sm:table-cell`}>
                {[c.contact, c.telephone].filter(Boolean).join(" · ") || "—"}
              </td>
              <td className={`${CELLULE} text-right font-display text-[1.05rem] font-semibold`}>
                {formaterNombre(c.unites)}
              </td>
              <td className={`${CELLULE} hidden text-right text-ink-soft sm:table-cell`}>{c.nb_produits}</td>
              <td className={`${CELLULE} hidden text-right text-ink-soft sm:table-cell`}>{c.nb_livraisons}</td>
              <td className={`${CELLULE} text-right whitespace-nowrap text-ink-soft`}>
                {formaterDate(c.derniere_livraison)}
              </td>
            </tr>
          ))}
        </Tableau>
      ) : (
        <Grille>
          {filtres.map((c) => (
            <Link key={c.id} href={lien(c.id)} className="grid rounded-[1.4rem] focus-visible:outline-offset-4">
              <Tuile>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-display text-[1.05rem] font-semibold tracking-[-0.02em]">
                      {c.nom}
                    </h3>
                    <p className="truncate text-[0.82rem] text-ink-faint">
                      {[c.contact, c.telephone].filter(Boolean).join(" · ") || "—"}
                    </p>
                  </div>
                  <p className="shrink-0 text-right">
                    <span className="block font-display text-[1.6rem] leading-none font-semibold">
                      {formaterNombre(c.unites)}
                    </span>
                    <span className="text-[0.75rem] text-ink-faint">unités</span>
                  </p>
                </div>
                <p className="mt-auto pt-3 text-[0.82rem] text-ink-soft">
                  {c.nb_livraisons > 0
                    ? `${c.nb_produits} réf. · ${c.nb_livraisons} livraison${c.nb_livraisons > 1 ? "s" : ""} · dernière le ${formaterDate(c.derniere_livraison)}`
                    : "Aucune livraison sur la période"}
                </p>
              </Tuile>
            </Link>
          ))}
        </Grille>
      )}
    </div>
  );
}
