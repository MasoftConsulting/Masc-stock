import { Reveler } from "@/components/reveler";
import { listerClients } from "@/lib/clients";
import { listerProduitsComplet } from "@/lib/produits";
import { listerContacts } from "@/lib/contacts";
import { listerEquipements } from "@/lib/equipements";
import { lireSession } from "@/lib/session";
import { FormulaireBL } from "./formulaire-bl";

export const dynamic = "force-dynamic";

export default async function PageNouveauBL() {
  const session = await lireSession();

  const [clients, produits, contacts, equipements] = await Promise.all([
    listerClients(),
    listerProduitsComplet(),
    listerContacts(),
    listerEquipements(),
  ]);

  const produitsDispo = produits.filter((p) => p.actif && p.quantite > 0);

  return (
    <>
      <Reveler>
        <header className="pt-8 md:pt-14">
          <h1 className="font-display text-[2.4rem] font-semibold tracking-[-0.045em]">
            Nouveau bon<br /><span className="text-ink-faint">de livraison</span>
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
          />
        </div>
      </Reveler>
    </>
  );
}