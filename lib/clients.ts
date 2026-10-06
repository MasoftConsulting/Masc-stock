import "server-only";
import { clientSupabase, echecLecture } from "./supabase";
import type { Client } from "./types-stock";

export type { Client };

/** Table `clients` de masc-fiche (base partagée) : lecture seule ici. */
const TABLE = "clients";

export async function listerClients(): Promise<Client[]> {
  const { data, error } = await clientSupabase()
    .from(TABLE)
    .select("*")
    .order("nom");

  if (error) echecLecture("clients", error);
  return data as Client[];
}
