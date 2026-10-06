import type { NextRequest } from "next/server";
import { telechargerFicheClient } from "@/lib/export/telechargement";
import { ficheClientPdf } from "@/lib/export/fiche-client-pdf";

export async function GET(request: NextRequest, ctx: RouteContext<"/clients/[id]/pdf">) {
  const { id } = await ctx.params;
  return telechargerFicheClient(
    request,
    id,
    { extension: "pdf", type: "application/pdf" },
    async (fiche, genereLe) => new Uint8Array(await ficheClientPdf(fiche, genereLe)),
  );
}
