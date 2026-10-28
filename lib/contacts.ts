import "server-only";
import { tablesPartagees } from "./supabase";
import type { Contact } from "./types-stock";

const TABLE = "contacts";

export async function listerContacts(clientId?: string): Promise<Contact[]> {
  let requete = tablesPartagees().from(TABLE).select("*").order("nom");
  if (clientId) requete = requete.eq("client_id", clientId);

  const { data, error } = await requete;
  if (error) {
    console.error("[contacts] listerContacts", error.message);
    return [];
  }
  return (data ?? []) as Contact[];
}