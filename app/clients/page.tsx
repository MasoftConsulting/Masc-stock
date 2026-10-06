import { Coquille } from "@/components/coquille";
import { Reveler } from "@/components/reveler";
import { EnTetePage } from "@/components/ui";
import { SelecteurPeriode } from "@/components/selecteur-periode";
import { listerClientsAvecResume } from "@/lib/clients";
import { lirePeriode } from "@/lib/periode";
import { ListeClients } from "./liste-clients";

export const dynamic = "force-dynamic";

export default async function PageClients({ searchParams }: PageProps<"/clients">) {
  const periode = lirePeriode(await searchParams, "annee");
  const clients = await listerClientsAvecResume(periode);

  return (
    <Coquille>
      <Reveler>
        <EnTetePage rubrique="Référentiel" titre="Clients">
          Consommables livrés à chaque client. Les clients sont gérés dans
          MASC Fiche ; ouvrez une fiche pour le détail et le téléchargement.
        </EnTetePage>
      </Reveler>

      <Reveler delai={60}>
        <div className="mt-10">
          <SelecteurPeriode chemin="/clients" periode={periode} />
        </div>
      </Reveler>

      <Reveler delai={90}>
        <div className="mt-6">
          <ListeClients clients={clients} periode={periode} />
        </div>
      </Reveler>
    </Coquille>
  );
}
