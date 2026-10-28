import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { lireBonLivraison } from "@/lib/bons-livraison";
import { formaterDate } from "@/lib/format";
import { equipementCompatible } from "@/lib/compatibilite";
import { BarreOutilsImpression } from "@/components/barre-outils-impression";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  return { title: `Bon de livraison` };
}

export default async function PageImpressionBL({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const bl = await lireBonLivraison(id);

  if (!bl) notFound();

  const formaterContacts = (noms: string | null) => {
    if (!noms) return "—";
    return noms
      .split(",")
      .map((nom) => {
        const nomNettoye = nom.trim();
        if (!nomNettoye) return "";
        if (/^(m\.|m\s|monsieur|mme|madame|mlle|dr|docteur)/i.test(nomNettoye)) {
          return nomNettoye;
        }
        return `M. ${nomNettoye}`;
      })
      .filter(Boolean)
      .join(", ");
  };

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white print:min-h-0">
      <BarreOutilsImpression retour={`/livraisons`} titre={`BL ${bl.numero}`} />

      {/* Conteneur A4 */}
      <div className="mx-auto my-8 w-[210mm] min-h-[297mm] bg-white p-[15mm] shadow-xl print:m-0 print:w-[210mm] print:h-[297mm] print:min-h-0 print:shadow-none print:p-[15mm] print:box-border print:flex print:flex-col print:overflow-hidden">
        
        {/* En-tête - Logo agrandi à 75px */}
        <div className="flex items-start justify-between border-b-2 border-ink pb-4 shrink-0">
          <div>
            <img 
              src="/logo-bl.png" 
              alt="MA SOFT CONSULTING" 
              className="h-[75px] w-auto object-contain" 
            />
          </div>
          <div className="text-right mt-1">
            <h1 className="font-display text-[1.4rem] font-bold text-ink uppercase tracking-wide">
              Bon de livraison
            </h1>
            <p className="mt-1 font-mono text-[1.1rem] text-brand font-semibold">
              N° {bl.numero}
            </p>
          </div>
        </div>

        {/* Bloc d'informations */}
        <div className="mt-5 border border-ink text-[0.85rem] shrink-0">
          <div className="grid grid-cols-2 border-b border-ink">
            <div className="p-3 border-r border-ink space-y-1.5">
              <p><span className="font-semibold text-ink">Date :</span> {formaterDate(bl.date_livraison)}</p>
              <p><span className="font-semibold text-ink">N° de commande :</span> {bl.numero_commande ?? "N/A"}</p>
              <p><span className="font-semibold text-ink">Émis par :</span> {bl.emis_par}</p>
            </div>
            <div className="p-3 space-y-1.5">
              <p className="font-bold text-[1rem] text-ink">{bl.client_nom}</p>
              <p><span className="font-semibold text-ink">Lieu :</span> {bl.client_adresse ?? "—"}</p>
              <p><span className="font-semibold text-ink">N° de client :</span> {bl.client_nom}</p>
            </div>
          </div>
          <div className="p-3">
            <p>
              <span className="font-semibold text-ink">Contact client :</span>{" "}
              {formaterContacts(bl.contact_noms)}
              {bl.contact_details && ` (${bl.contact_details})`}
            </p>
          </div>
        </div>

        {/* Tableau des produits */}
        <div className="mt-6 shrink-0">
          <table className="w-full text-left text-[0.85rem] border-collapse border border-ink">
            <thead>
              <tr className="bg-ink/[0.03] border-b border-ink">
                <th className="py-2.5 px-3 font-bold uppercase border-r border-ink w-1/4">Modèles</th>
                <th className="py-2.5 px-3 font-bold uppercase border-r border-ink text-center w-20">QTE</th>
                <th className="py-2.5 px-3 font-bold uppercase">SN</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink/20">
              {bl.lignes.map((ligne) => {
                // Modèles compatibles (dédupliqués, sans SN)
                const modelesCompatibles = Array.from(
                  new Set(
                    bl.client_equipements
                      .filter((e) => equipementCompatible(e, ligne.produit_compatibilite))
                      .map((e) => e.marque_modele)
                      .filter((m): m is string => Boolean(m)),
                  ),
                );

                return (
                  <tr key={ligne.id}>
                    <td className="py-3 px-3 font-mono text-brand border-r border-ink">{ligne.produit_reference}</td>
                    <td className="py-3 px-3 text-center font-bold text-[1rem] border-r border-ink">{ligne.quantite}</td>
                    <td className="py-3 px-3">
                      <p>{ligne.produit_nom}</p>
                      {ligne.produit_type && <p className="text-[0.75rem] text-ink-soft"> · {ligne.produit_type}</p>}
                      
                      {/* Modèle(s) compatible(s) — sans SN */}
                      {modelesCompatibles.length > 0 && (
                        <p className="mt-1.5 inline-block text-[0.7rem] font-medium text-brand bg-brand/5 px-2 py-1 rounded">
                          Machine concernée : {modelesCompatibles.join(", ")}
                        </p>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Zone de signature */}
        <div className="mt-16 mb-8 flex justify-start shrink-0">
          <div className="w-[85mm]">
            <p className="text-[0.85rem] font-bold text-ink uppercase mb-2">Visa du client :</p>
            <div className="h-32 rounded-sm border border-ink bg-white flex items-center justify-center relative">
              {bl.signature_client ? (
                <img src={bl.signature_client} alt="Signature client" className="max-h-full max-w-full object-contain p-2" />
              ) : (
                <span className="text-[0.75rem] text-ink-faint">Signature et cachet</span>
              )}
            </div>
          </div>
        </div>

        {/* Pied de page - Logo agrandi à 40px */}
        <div className="mt-auto shrink-0">
          <div className="border-t border-ink pt-4 flex justify-between items-center text-[0.65rem] text-ink-faint uppercase tracking-widest">
            
            <div className="flex items-center gap-2">
              <img 
                src="/logo-bl.png" 
                alt="MA SOFT CONSULTING" 
                className="h-[40px] w-auto object-contain opacity-80" 
              />
            </div>
            
            <div className="text-center leading-tight">
              <p>Lomé, Togo · +228 91 35 00 00 · support@masoft-consulting.com</p>
            </div>
            
            <span>{bl.numero}</span>
          </div>
        </div>
        
      </div>
    </div>
  );
}