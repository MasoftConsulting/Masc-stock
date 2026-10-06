import type { NextRequest } from "next/server";
import { telechargerFicheClient } from "@/lib/export/telechargement";
import { ficheClientCsv } from "@/lib/export/fiche-client-csv";

export async function GET(request: NextRequest, ctx: RouteContext<"/clients/[id]/csv">) {
  const { id } = await ctx.params;
  return telechargerFicheClient(
    request,
    id,
    { extension: "csv", type: "text/csv; charset=utf-8" },
    ficheClientCsv,
  );
}
