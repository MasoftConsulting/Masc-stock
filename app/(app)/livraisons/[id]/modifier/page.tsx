import { notFound } from "next/navigation";
import { Reveler } from "@/components/reveler";
import { lireBonLivraison } from "@/lib/bons-livraison";
import { listerClients } from "@/lib/clients";
import { listerProduitsComplet } from "@/lib/produits";
import { listerContacts } from "@/lib/contacts";
import { listerEquipements } from "@/lib/equipements";
import { FormulaireBL } from "../../nouveau/formulaire-bl";

export const dynamic = "force-dynamic";

export default async function PageModifierBL({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const [bl, clients, produits, contacts, equipements] = await Promise.all([
    lireBonLivraison(id),
    listerClients(),
    listerProduitsComplet(),
    listerContacts(),
    listerEquipements(),
  ]);

  if (!bl) notFound();

  const produitsDispo = produits.filter((p) => p.actif);

  return (
    <>
      <Reveler>
        <header className="pt-8 md:pt-14">
          <h1 className="font-display text-[2.4rem] font-semibold tracking-[-0.045em]">
            Modifier le BL<br />
            <span className="text-ink-faint">{bl.numero}</span>
          </h1>
        </header>
      </Reveler>
      <Reveler delai={90}>
        <div className="mt-8">
          <FormulaireBL
            clients={clients}
            contacts={contacts}
            produits={produitsDispo}
            equipements={equipements}
            emetteur="Michel AMADOS"
            blId={bl.id}
            initialValues={{
              clientId: bl.client_id,
              contactNoms: bl.contact_noms ?? "",
              contactDetails: bl.contact_details ?? "",
              lignes: bl.lignes.map((l) => ({ produit_id: l.produit_id, quantite: l.quantite })),
              signature: bl.signature_client,
            }}
          />
        </div>
      </Reveler>
    </>
  );
}