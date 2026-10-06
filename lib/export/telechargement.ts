import "server-only";
import type { NextRequest } from "next/server";
import { lireSession } from "../session";
import { lireFicheClient, type FicheClient } from "../clients";
import { lirePeriode } from "../periode";

/**
 * Socle commun des téléchargements de fiche client (PDF, CSV).
 *
 * Les route handlers ne passent pas par les Server Actions : on revérifie la
 * session ici, en plus du proxy.
 */
export async function telechargerFicheClient(
  request: NextRequest,
  id: string,
  format: { extension: string; type: string },
  generer: (fiche: FicheClient, genereLe: Date) => Promise<BodyInit> | BodyInit,
): Promise<Response> {
  if (!(await lireSession())) {
    return new Response("Non autorisé.", { status: 401 });
  }

  const periode = lirePeriode(Object.fromEntries(request.nextUrl.searchParams), "annee");
  const fiche = await lireFicheClient(id, periode);
  if (!fiche) return new Response("Client introuvable.", { status: 404 });

  const genereLe = new Date();
  const nom = [
    "fiche",
    slug(fiche.client.nom),
    periode.du ?? "debut",
    periode.au ?? genereLe.toISOString().slice(0, 10),
  ].join("_");

  return new Response(await generer(fiche, genereLe), {
    headers: {
      "Content-Type": format.type,
      "Content-Disposition": `attachment; filename="${nom}.${format.extension}"`,
      "Cache-Control": "private, no-store",
    },
  });
}

/** Nom de fichier ASCII sûr : « Société Générale » → « societe-generale ». */
function slug(texte: string): string {
  return (
    texte
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 50) || "client"
  );
}
