import "server-only";
import { clientSupabase } from "./supabase";
import type { Contact } from "./types-stock";

const TABLE = "contacts";

export async function listerContacts(clientId?: string): Promise<Contact[]> {
  const supabase = clientSupabase();
  if (!supabase) return [];

  let requete = supabase.from(TABLE).select("*").order("nom");
  if (clientId) requete = requete.eq("client_id", clientId);

  const { data, error } = await requete;
  if (error) {
    console.error("[contacts] listerContacts", error.message);
    return [];
  }
  return (data ?? []) as Contact[];
}