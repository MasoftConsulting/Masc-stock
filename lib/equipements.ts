import "server-only";
import { clientSupabase } from "./supabase";
import type { Equipement } from "./types-stock";

const TABLE_EQUIPEMENTS = "equipements";

export async function listerEquipements(): Promise<Equipement[]> {
  const { data, error } = await clientSupabase()
    .from(TABLE_EQUIPEMENTS)
    .select("id, client_id, marque_modele, numero_serie, localisation")
    .order("marque_modele", { ascending: true, nullsFirst: false });

  if (error) {
    console.error("[equipements] listerEquipements", error.message);
    return [];
  }

  return (data ?? []) as Equipement[];
}