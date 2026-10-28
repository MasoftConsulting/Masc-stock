"use client";

import { useActionState, useState } from "react";
import { creerBLAction, modifierBLAction, type EtatBL } from "../actions";
import { SignaturePadBL } from "@/components/signature-pad-bl";
import { equipementCompatible } from "@/lib/compatibilite";
import type {
  Client,
  ProduitAvecStock,
  Contact,
  Equipement,
} from "@/lib/types-stock";

type Ligne = { id: string; produitId: string; quantite: number };

/**
 * Vérifie si un produit est compatible avec les machines d'un client.
 * Retourne `null` si la vérification est impossible
 * (pas de compatibilité renseignée, pas de client, aucune machine enregistrée).
 */
function verifierCompatibilite(
  produit: ProduitAvecStock | undefined,
  clientId: string,
  equipements: Equipement[],
): {
  compatible: boolean;
  machinesClient: string[];
  machinesCompatibles: string[];
} | null {
  if (!produit?.compatibilite || !clientId) return null;

  const equipementsClient = equipements.filter(
    (e) => e.client_id === clientId && e.marque_modele,
  );

  if (equipementsClient.length === 0) return null;

  const machinesCompatibles = equipementsClient
    .filter((e) => equipementCompatible(e, produit.compatibilite))
    .map((e) => e.marque_modele!);

  return {
    compatible: machinesCompatibles.length > 0,
    machinesClient: equipementsClient.map((e) => e.marque_modele!),
    machinesCompatibles,
  };
}

export function FormulaireBL({
  clients,
  contacts,
  produits,
  equipements,
  emetteur,
  blId,
  initialValues,
}: {
  clients: Client[];
  contacts: Contact[];
  produits: ProduitAvecStock[];
  equipements: Equipement[];
  emetteur: string;
  blId?: string;
  initialValues?: {
    clientId: string;
    contactNoms: string;
    contactDetails: string;
    lignes: { produit_id: string; quantite: number }[];
    signature: string | null;
  };
}) {
  const actionServeur = blId ? modifierBLAction : creerBLAction;
  const [etat, action, enCours] = useActionState<EtatBL, FormData>(
    actionServeur,
    {},
  );

  const [lignes, setLignes] = useState<Ligne[]>(
    initialValues?.lignes.map((l) => ({
      id: crypto.randomUUID(),
      produitId: l.produit_id,
      quantite: l.quantite,
    })) ?? [{ id: crypto.randomUUID(), produitId: "", quantite: 1 }],
  );

  const [signature, setSignature] = useState<string | null>(
    initialValues?.signature ?? null,
  );
  const [clientId, setClientId] = useState(initialValues?.clientId ?? "");
  const [contactNoms, setContactNoms] = useState(
    initialValues?.contactNoms ?? "",
  );
  const [contactDetails, setContactDetails] = useState(
    initialValues?.contactDetails ?? "",
  );
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);
  // Échappatoire explicite : l'utilisateur doit cocher pour valider malgré une incompatibilité.
  const [forcerIncompatibilite, setForcerIncompatibilite] = useState(false);

  const contactsDuClient = clientId
    ? contacts.filter((c) => c.client_id === clientId)
    : [];

  const handleClientChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setClientId(e.target.value);
    setSelectedContactIds([]);
    setContactNoms("");
    setContactDetails("");
    setForcerIncompatibilite(false);
  };

  const toggleContact = (contact: Contact) => {
    setSelectedContactIds((prev) => {
      const isSelected = prev.includes(contact.id);
      const newIds = isSelected
        ? prev.filter((id) => id !== contact.id)
        : [...prev, contact.id];
      const newNoms = contactsDuClient
        .filter((c) => newIds.includes(c.id))
        .map((c) => c.nom)
        .join(", ");
      setContactNoms(newNoms);
      return newIds;
    });
  };

  const ajouterLigne = () => {
    setLignes([
      ...lignes,
      { id: crypto.randomUUID(), produitId: "", quantite: 1 },
    ]);
  };

  const supprimerLigne = (id: string) => {
    if (lignes.length === 1) return;
    setLignes(lignes.filter((l) => l.id !== id));
  };

  const modifierLigne = (
    id: string,
    champ: keyof Ligne,
    valeur: string | number,
  ) => {
    setLignes(lignes.map((l) => (l.id === id ? { ...l, [champ]: valeur } : l)));
  };

  const lignesValides = lignes
    .filter((l) => l.produitId && l.quantite > 0)
    .map((l) => ({ produit_id: l.produitId, quantite: l.quantite }));

  // Pré-calcul des incompatibilités par ligne (Map ligneId -> machines du client)
  const incompatibilitesParLigne = new Map<string, string[]>();
  for (const l of lignes) {
    if (!l.produitId || !clientId) continue;
    const produit = produits.find((p) => p.id === l.produitId);
    const res = verifierCompatibilite(produit, clientId, equipements);
    if (res && !res.compatible) {
      incompatibilitesParLigne.set(l.id, res.machinesClient);
    }
  }
  const aDesIncompatibilites = incompatibilitesParLigne.size > 0;
  const submitBloque =
    enCours ||
    lignesValides.length === 0 ||
    (aDesIncompatibilites && !forcerIncompatibilite);

  return (
    <form action={action} className="space-y-6">
      {blId && <input type="hidden" name="id" value={blId} />}
      <input
        type="hidden"
        name="lignes_json"
        value={JSON.stringify(lignesValides)}
      />
      <input
        type="hidden"
        name="signature_client"
        value={signature ?? ""}
      />
      <input type="hidden" name="emis_par" value={emetteur} />

      <section className="rounded-[2rem] bg-white/45 p-6 ring-1 ring-white/60 sm:p-8">
        <h2 className="mb-4 font-display text-[1.2rem] font-semibold border-b border-hairline pb-4">
          1. Informations client
        </h2>

        <div className="grid gap-5">
          <label className="block">
            <span className="etiquette">Client *</span>
            <select
              name="client_id"
              required
              className="champ"
              value={clientId}
              onChange={handleClientChange}
            >
              <option value="">— Sélectionner un client —</option>
              {clients.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.nom}
                </option>
              ))}
            </select>
          </label>

          {clientId && (
            <div className="rounded-xl border border-hairline bg-ink/[0.02] p-4">
              <span className="etiquette mb-2 block">
                Contacts rattachés à ce client
              </span>
              {contactsDuClient.length === 0 ? (
                <p className="text-[0.85rem] text-ink-faint">
                  Aucun contact enregistré pour ce client.
                </p>
              ) : (
                <div className="flex flex-wrap gap-3">
                  {contactsDuClient.map((c) => (
                    <label
                      key={c.id}
                      className="flex cursor-pointer items-center gap-2 rounded-full bg-white px-3 py-1.5 shadow-sm ring-1 ring-hairline hover:bg-surface"
                    >
                      <input
                        type="checkbox"
                        className="case"
                        checked={selectedContactIds.includes(c.id)}
                        onChange={() => toggleContact(c)}
                      />
                      <span className="text-[0.85rem]">{c.nom}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="etiquette">Contacts sur place</span>
              <input
                name="contact_noms"
                className="champ"
                placeholder="Ex. M. TOUGGOURT"
                value={contactNoms}
                onChange={(e) => setContactNoms(e.target.value)}
              />
            </label>
            <label className="block">
              <span className="etiquette">Localisation / Précision</span>
              <input
                name="contact_details"
                className="champ"
                placeholder="Ex. 3ème étage : Service Informatique"
                value={contactDetails}
                onChange={(e) => setContactDetails(e.target.value)}
              />
            </label>
          </div>
        </div>
      </section>

      <section className="rounded-[2rem] bg-white/45 p-6 ring-1 ring-white/60 sm:p-8">
        <h2 className="mb-4 font-display text-[1.2rem] font-semibold border-b border-hairline pb-4">
          2. Produits livrés
        </h2>

        <div className="space-y-3">
          {lignes.map((ligne) => (
            <div
              key={ligne.id}
              className="flex flex-wrap items-end gap-3 rounded-xl bg-ink/[0.02] p-3 sm:flex-nowrap border border-hairline"
            >
              <label className="block flex-1 min-w-[200px]">
                <span className="etiquette text-[0.65rem]">Produit</span>
                <select
                  value={ligne.produitId}
                  onChange={(e) =>
                    modifierLigne(ligne.id, "produitId", e.target.value)
                  }
                  className="champ py-2"
                >
                  <option value="">— Sélectionner —</option>
                  {produits.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.reference} · {p.nom} (Reste: {p.quantite})
                    </option>
                  ))}
                </select>

                {incompatibilitesParLigne.has(ligne.id) && (
                  <div className="mt-1 space-y-0.5">
                    <p className="text-[0.7rem] font-medium text-amber">
                      ⚠️ Aucune machine de ce client ne correspond à ce produit.
                    </p>
                    <p className="text-[0.68rem] text-ink-faint">
                      Machines du client :{" "}
                      {incompatibilitesParLigne.get(ligne.id)!.join(", ")}
                    </p>
                  </div>
                )}
              </label>
              <label className="block w-24">
                <span className="etiquette text-[0.65rem]">Qté</span>
                <input
                  type="number"
                  min={1}
                  value={ligne.quantite}
                  onChange={(e) =>
                    modifierLigne(ligne.id, "quantite", Number(e.target.value))
                  }
                  className="champ py-2 font-mono text-center"
                />
              </label>
              <button
                type="button"
                onClick={() => supprimerLigne(ligne.id)}
                disabled={lignes.length === 1}
                className="h-[38px] rounded-full px-4 text-[0.8rem] text-rouille hover:bg-rouille/10 disabled:opacity-30"
              >
                Retirer
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={ajouterLigne}
          className="mt-4 rounded-full bg-ink/5 px-4 py-2 text-[0.85rem] font-medium text-ink transition-colors hover:bg-ink/10"
        >
          + Ajouter une ligne
        </button>
      </section>

      <section className="rounded-[2rem] bg-white/45 p-6 ring-1 ring-white/60 sm:p-8">
        <h2 className="mb-4 font-display text-[1.2rem] font-semibold border-b border-hairline pb-4">
          3. Validation
        </h2>
        <SignaturePadBL onChange={setSignature} />
      </section>

      {aDesIncompatibilites && (
        <div className="space-y-2 rounded-2xl bg-amber/10 px-5 py-4 text-[0.85rem] text-amber">
          <p className="font-medium">
            ⚠️ Un ou plusieurs produits ne sont pas compatibles avec les
            machines de ce client.
          </p>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="case"
              checked={forcerIncompatibilite}
              onChange={(e) => setForcerIncompatibilite(e.target.checked)}
            />
            <span>Je confirme vouloir valider malgré cette incompatibilité.</span>
          </label>
        </div>
      )}

      {etat.erreur && (
        <p className="rounded-2xl bg-rouille/10 px-5 py-4 text-[0.85rem] text-rouille">
          {etat.erreur}
        </p>
      )}

      <div className="flex justify-end">
        <button
          type="submit"
          disabled={submitBloque}
          className="rounded-full bg-ink px-8 py-4 text-[0.95rem] font-medium text-white transition-all duration-500 ease-mass hover:bg-navy-deep active:scale-[0.98] disabled:opacity-50"
        >
          {enCours
            ? "Traitement en cours…"
            : blId
              ? "Enregistrer les modifications"
              : "Valider le BL"}
        </button>
      </div>
    </form>
  );
}