"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { lireSession } from "@/lib/session";
import { clientSupabase } from "@/lib/supabase";
import { enregistrerJournal } from "@/lib/journal";

export type EtatBL = { erreur?: string; token?: string };

export async function creerBLAction(
  _etat: EtatBL,
  formData: FormData,
): Promise<EtatBL> {
  const session = await lireSession();
  if (!session) return { erreur: "Non autorisé." };

  const supabase = clientSupabase();

  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return { erreur: "Sélectionnez un client." };

  const contactNoms = String(formData.get("contact_noms") ?? "").trim() || null;
  const contactDetails = String(formData.get("contact_details") ?? "").trim() || null;
  const numeroCommande = String(formData.get("numero_commande") ?? "").trim() || null;
  const emisPar = String(formData.get("emis_par") ?? "").trim() || "MA SOFT";
  const signature = String(formData.get("signature_client") ?? "") || null;

  // Récupération du tableau JSON des lignes
  let lignes: { produit_id: string; quantite: number }[] = [];
  try {
    const json = String(formData.get("lignes_json") ?? "[]");
    lignes = JSON.parse(json);
  } catch {
    return { erreur: "Format des lignes invalide." };
  }

  if (lignes.length === 0) {
    return { erreur: "Ajoutez au moins un produit au bon de livraison." };
  }

  // Appel de la RPC SQL
  const { data: blId, error } = await supabase.rpc("creer_bl_complet", {
    p_client_id: clientId,
    p_contact_noms: contactNoms,
    p_contact_details: contactDetails,
    p_emis_par: emisPar,
    p_signature: signature,
    p_lignes: lignes,
  });

  if (error) {
    console.error("[bl] creerBLAction", error.message);
    return { erreur: "Erreur lors de la création : " + error.message };
  }

  // Récupère le numéro pour le journal
  const { data: blInfo } = await supabase
    .from("bons_livraison")
    .select("numero")
    .eq("id", blId)
    .maybeSingle();

  // ✅ AJOUT : journal
  await enregistrerJournal({
    action: "bl.creation",
    table_cible: "bons_livraison",
    ligne_id: blId as string,
    details: {
      numero: blInfo?.numero ?? null,
      nb_lignes: lignes.length,
    },
  });

  revalidatePath("/livraisons");
  revalidatePath("/mouvements");
  revalidatePath("/produits");
  revalidatePath("/");
  revalidatePath("/journal");

  redirect(`/impression/bl/${blId}`);
}

export async function supprimerBLAction(formData: FormData) {
  const session = await lireSession();
  if (!session) redirect("/connexion");

  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/livraisons");

  const supabase = clientSupabase();

  // Récupère le numéro AVANT suppression (pour le journal)
  const { data: blInfo } = await supabase
    .from("bons_livraison")
    .select("numero")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.rpc("supprimer_bl_complet", { p_bl_id: id });

  if (error) {
    console.error("[bl] supprimerBLAction", error.message);
    redirect(`/livraisons?erreur=${encodeURIComponent(error.message)}`);
  }

  // ✅ AJOUT : journal
  await enregistrerJournal({
    action: "bl.suppression",
    table_cible: "bons_livraison",
    ligne_id: id,
    details: { numero: blInfo?.numero ?? null },
  });

  revalidatePath("/livraisons");
  revalidatePath("/mouvements");
  revalidatePath("/produits");
  revalidatePath("/");
  revalidatePath("/journal");

  redirect("/livraisons?supprime=1");
}

export async function modifierBLAction(
  _etat: EtatBL,
  formData: FormData,
): Promise<EtatBL> {
  const session = await lireSession();
  if (!session) return { erreur: "Non autorisé." };

  const supabase = clientSupabase();
  const id = String(formData.get("id") ?? "");
  if (!id) return { erreur: "BL introuvable." };

  const clientId = String(formData.get("client_id") ?? "");
  if (!clientId) return { erreur: "Sélectionnez un client." };

  const contactNoms = String(formData.get("contact_noms") ?? "").trim() || null;
  const contactDetails = String(formData.get("contact_details") ?? "").trim() || null;
  const emisPar = String(formData.get("emis_par") ?? "").trim() || "MA SOFT";
  const signature = String(formData.get("signature_client") ?? "") || null;

  let lignes: { produit_id: string; quantite: number }[] = [];
  try {
    lignes = JSON.parse(String(formData.get("lignes_json") ?? "[]"));
  } catch {
    return { erreur: "Format des lignes invalide." };
  }

  if (lignes.length === 0) {
    return { erreur: "Ajoutez au moins un produit au bon de livraison." };
  }

  // Récupère le numéro pour le journal
  const { data: blInfo } = await supabase
    .from("bons_livraison")
    .select("numero")
    .eq("id", id)
    .maybeSingle();

  const { error } = await supabase.rpc("modifier_bl_complet", {
    p_bl_id: id,
    p_client_id: clientId,
    p_contact_noms: contactNoms,
    p_contact_details: contactDetails,
    p_emis_par: emisPar,
    p_signature: signature,
    p_lignes: lignes,
  });

  if (error) {
    console.error("[bl] modifierBLAction", error.message);
    return { erreur: "Erreur lors de la modification : " + error.message };
  }

  // ✅ AJOUT : journal
  await enregistrerJournal({
    action: "bl.modification",
    table_cible: "bons_livraison",
    ligne_id: id,
    details: {
      numero: blInfo?.numero ?? null,
      nb_lignes: lignes.length,
    },
  });

  revalidatePath("/livraisons");
  revalidatePath("/mouvements");
  revalidatePath("/produits");
  revalidatePath("/");
  revalidatePath("/journal");

  redirect(`/impression/bl/${id}`);
}