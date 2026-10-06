"use server";

import { redirect } from "next/navigation";
import {
  estCodeValide,
  fermerSession,
  lireSession,
  ouvrirSession,
  sessionConfiguree,
} from "@/lib/session";

export type EtatFormulaire = { erreur?: string };

export async function connexion(
  _etat: EtatFormulaire,
  formData: FormData,
): Promise<EtatFormulaire> {
  if (!sessionConfiguree()) {
    return {
      erreur:
        "Accès non configuré : renseignez CODE_STOCK et SESSION_SECRET dans .env.local.",
    };
  }

  const code = String(formData.get("code") ?? "").trim();
  if (!code) return { erreur: "Saisissez votre code d'accès." };

  if (!estCodeValide(code)) {
    return { erreur: "Code d'accès incorrect." };
  }

  await ouvrirSession();
  redirect("/");
}

export async function deconnexion() {
  const session = await lireSession();
  if (session) await fermerSession();
  redirect("/connexion");
}