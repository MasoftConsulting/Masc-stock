import type { NextRequest } from "next/server";
import { telechargerFicheClient } from "@/lib/export/telechargement";
import { ficheClientXlsx } from "@/lib/export/fiche-client-xlsx";

export async function GET(request: NextRequest, ctx: RouteContext<"/clients/[id]/xlsx">) {
  const { id } = await ctx.params;
  return telechargerFicheClient(
    request,
    id,
    {
      extension: "xlsx",
      type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    },
    ficheClientXlsx,
  );
}
