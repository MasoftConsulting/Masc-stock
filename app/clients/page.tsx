import { Coquille } from "@/components/coquille";

export const dynamic = "force-dynamic";

export default function PageProduits() {
  return (
    <Coquille>
      <div className="pt-16 text-center text-ink-soft">
        <p className="font-display text-[1.5rem] font-semibold tracking-[-0.03em] text-ink">
          Clients
        </p>
        <p className="mt-3 text-[0.85rem]">À venir dans la prochaine étape.</p>
      </div>
    </Coquille>
  );
}